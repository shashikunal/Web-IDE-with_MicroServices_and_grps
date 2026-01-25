import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Import basic language support (Syntax Highlighting)
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/basic-languages/shell/shell.contribution';

// Standard industry pattern for Monaco + Vite
// This ensures workers run in separate threads for performance
export function setupMonacoEnv() {
    self.MonacoEnvironment = {
        getWorker(_: unknown, label: string) {
            if (label === 'json') {
                return new jsonWorker();
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return new cssWorker();
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new htmlWorker();
            }
            if (label === 'typescript' || label === 'javascript') {
                return new tsWorker();
            }
            return new editorWorker();
        },
    };

    // Common industry-standard configurations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tsLanguage = monaco.languages.typescript as any;
    const tsDefaults = tsLanguage.typescriptDefaults;
    const jsDefaults = tsLanguage.javascriptDefaults;

    tsDefaults.setEagerModelSync(true);

    const compilerOptions = {
        target: tsLanguage.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: tsLanguage.ModuleResolutionKind.NodeJs,
        module: tsLanguage.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: tsLanguage.JsxEmit.ReactJSX,
        reactNamespace: 'React',
        allowJs: true,
        allowSyntheticDefaultImports: true,
        typeRoots: ['node_modules/@types']
    };

    tsDefaults.setCompilerOptions(compilerOptions);
    jsDefaults.setCompilerOptions(compilerOptions);

    tsDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    });

    // Inject React types to fix "Cannot find name 'React'" errors
    tsDefaults.addExtraLib(
        `
        declare module 'react/jsx-runtime' {
            export function jsx(type: any, props: any, key?: any): any;
            export function jsxs(type: any, props: any, key?: any): any;
            export const Fragment: any;
        }
        
        declare module 'react' {
            export = React;
        }
        
        declare namespace React {
            function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
            function useEffect(effect: () => (void | (() => void)), deps?: ReadonlyArray<any>): void;
            function useMemo<T>(factory: () => T, deps: ReadonlyArray<any> | undefined): T;
            function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
            
            interface FunctionComponent<P = {}> {
                (props: P, context?: any): ReactElement<any, any> | null;
            }
            type FC<P = {}> = FunctionComponent<P>;
            interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
                type: T;
                props: P;
                key: Key | null;
            }
            type Key = string | number;
            type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>);
            class Component<P, S> {
                constructor(props: P, context?: any);
                setState(state: any, callback?: () => void): void;
                render(): ReactNode;
            }
            type ReactNode = ReactElement | string | number | boolean | null | undefined;
        }
        declare global {
            namespace JSX {
                interface Element extends React.ReactElement<any, any> { }
                interface IntrinsicElements {
                    [elemName: string]: any;
                }
            }
        }
        `,
        'file:///node_modules/@types/react/index.d.ts'
    );
}
