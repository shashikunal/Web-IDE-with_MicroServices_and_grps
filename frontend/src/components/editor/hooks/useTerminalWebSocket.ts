import { useEffect, useRef, useCallback } from 'react';

export interface TerminalType {
    id: string;
    name: string;
    isActive: boolean;
}

export interface UseTerminalWebSocketProps {
    userId: string;
    containerId: string;
    terminals: TerminalType[];
    templateId: string;
    templateName: string;
    publicPort: number;
    onConnectionChange: (connected: boolean) => void;
}

const START_COMMANDS: Record<string, string> = {
    // JavaScript/TypeScript Frameworks
    'react-app': 'CHOKIDAR_USEPOLLING=true npm run dev -- --host 0.0.0.0 --port 5173',
    'node-hello': 'PORT=3000 npm start',
    'nextjs': 'npm run dev',
    'angular': 'ng serve --project my-app --host 0.0.0.0 --allowed-hosts=all --poll 2000',
    'vue-app': 'npm run dev -- --host 0.0.0.0',

    // Python Frameworks
    'python-core': 'python main.py',
    'django': 'python manage.py runserver 0.0.0.0:8000',
    'fastapi-app': 'uvicorn main:app --host 0.0.0.0 --port 8000 --reload',

    // Go
    'go-api': 'go run main.go',

    // Static Sites
    'html-site': 'npx serve -y -p 3000 .',

    // Compiled Languages
    'cpp-hello': 'g++ -o app main.cpp && ./app',
    'c-lang': 'gcc -o app main.c && ./app',
    'rust-lang': 'cargo run',

    // JVM Languages
    'java-maven': 'mvn spring-boot:run',
    'spring-boot': 'mvn spring-boot:run',

    // Other Languages
    'ruby-lang': 'ruby main.rb',
    'php-lang': 'php -S 0.0.0.0:8000',
    'dotnet': 'dotnet run'
};

export function useTerminalWebSocket({
    userId,
    containerId,
    terminals,
    templateId,
    templateName,
    publicPort,
    onConnectionChange
}: UseTerminalWebSocketProps) {
    const socketsRef = useRef<Map<string, WebSocket>>(new Map());
    const terminalHistoryRef = useRef<Record<string, string>>({});
    const terminalWritersRef = useRef<Map<string, (data: string) => void>>(new Map());

    const connectTerminal = useCallback((terminalId: string, isMain: boolean) => {
        if (socketsRef.current.has(terminalId)) return;
        if (!containerId || containerId === 'null') return;

        const host = window.location.hostname;
        const port = '3000'; // Or from config if available, but usually gateway is 3000
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // If we are in dev (localhost:5173), we likely want localhost:3000.
        // If we are in prod, we might want the same host.
        // Better: Use `ws://${host}:3000` or rely on Vite proxy if configured.

        // Since Vite proxy is configured for /ws -> localhost:3000
        const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&termId=${terminalId}&containerId=${containerId}`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        socketsRef.current.set(terminalId, ws);

        ws.onopen = () => {
            if (isMain) onConnectionChange(true);

            const welcomeMessage = [
                '\r\n\x1b[38;5;33m┌──────────────────────────────────────────────────────────────┐\x1b[0m',
                '\x1b[38;5;33m│                                                              │\x1b[0m',
                `\x1b[38;5;33m│  \x1b[1;37mWelcome to Cloud IDE\x1b[0m ${isMain ? '(Main)' : '(Secondary)'}                          \x1b[38;5;33m│\x1b[0m`,
                `\x1b[38;5;33m│  \x1b[36mEnvironment\x1b[0m:    ${templateName.padEnd(36)} \x1b[38;5;33m│\x1b[0m`,
                `\x1b[38;5;33m│  \x1b[36mPort\x1b[0m:           ${publicPort.toString().padEnd(36)} \x1b[38;5;33m│\x1b[0m`,
                `\x1b[38;5;33m│  \x1b[36mStatus\x1b[0m:         \x1b[32m● Online\x1b[0m                                \x1b[38;5;33m│\x1b[0m`,
                '\x1b[38;5;33m│                                                              │\x1b[0m',
                '\x1b[38;5;33m└──────────────────────────────────────────────────────────────┘\x1b[0m',
                '\r\n'
            ].join('\r\n');

            terminalHistoryRef.current[terminalId] = (terminalHistoryRef.current[terminalId] || '') + welcomeMessage;

            const writer = terminalWritersRef.current.get(terminalId);
            if (writer) writer(welcomeMessage);


        };

        ws.onmessage = (event) => {
            let data = event.data;

            if (data instanceof ArrayBuffer) {
                const decoder = new TextDecoder();
                data = decoder.decode(data);
            }

            terminalHistoryRef.current[terminalId] = (terminalHistoryRef.current[terminalId] || '') + data;
            const writer = terminalWritersRef.current.get(terminalId);
            if (writer) writer(data);
        };

        ws.onclose = () => {
            if (isMain) onConnectionChange(false);
            socketsRef.current.delete(terminalId);
        };

        ws.onerror = () => {
            if (isMain) onConnectionChange(false);
        };
    }, [userId, onConnectionChange]);

    useEffect(() => {
        if (!userId) return;

        terminals.forEach(t => {
            if (!socketsRef.current.has(t.id)) {
                connectTerminal(t.id, t.id === 'main');
            }
        });

        const activeIds = new Set(terminals.map(t => t.id));
        socketsRef.current.forEach((ws, id) => {
            if (!activeIds.has(id)) {
                ws.close();
                socketsRef.current.delete(id);
            }
        });
    }, [terminals, userId, connectTerminal]);

    useEffect(() => {
        return () => {
            const sockets = socketsRef.current;
            sockets.forEach(ws => ws.close());
            sockets.clear();
        };
    }, []);

    const handleTerminalData = useCallback((terminalId: string, data: string) => {
        const ws = socketsRef.current.get(terminalId);
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    }, []);

    const handleTerminalResize = useCallback((terminalId: string, cols: number, rows: number) => {
        const ws = socketsRef.current.get(terminalId);
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
    }, []);

    const handleTerminalReady = useCallback((terminalId: string, writer: { write: (data: string) => void }) => {
        terminalWritersRef.current.set(terminalId, writer.write);
    }, []);

    return {
        socketsRef,
        terminalHistoryRef,
        handleTerminalData,
        handleTerminalResize,
        handleTerminalReady
    };
}
