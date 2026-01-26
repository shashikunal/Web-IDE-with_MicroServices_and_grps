/**
 * Lua WASM Runner using Fengari
 * Provides Lua 5.3 runtime in the browser
 */

import type { ExecutionResult, WasmRunner } from './common';
import { measureExecutionTime, formatError } from './common';

class LuaRunner implements WasmRunner {
    private fengari: any = null;
    private isLoading = false;

    async init(): Promise<void> {
        if (this.fengari || this.isLoading) return;

        this.isLoading = true;
        try {
            // Load Fengari from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js';

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            // @ts-ignore
            this.fengari = window.fengari;
            console.log('[WASM] Fengari (Lua) initialized successfully');
        } catch (error) {
            console.error('[WASM] Failed to initialize Fengari:', error);
            throw new Error(`Fengari initialization failed: ${formatError(error)}`);
        } finally {
            this.isLoading = false;
        }
    }

    isInitialized(): boolean {
        return this.fengari !== null;
    }

    async run(code: string): Promise<ExecutionResult> {
        if (!this.fengari) {
            await this.init();
        }

        const { result, executionTime } = await measureExecutionTime(async () => {
            try {
                const { lua, lauxlib, lualib, to_jsstring } = this.fengari;
                const L = lauxlib.luaL_newstate();
                lualib.luaL_openlibs(L);

                let output = '';

                // Override print function to capture output
                const printOverride = `
          local original_print = print
          print = function(...)
            local args = {...}
            local str = ""
            for i, v in ipairs(args) do
              if i > 1 then str = str .. "\\t" end
              str = str .. tostring(v)
            end
            _OUTPUT = (_OUTPUT or "") .. str .. "\\n"
          end
        `;

                // Execute override and user code
                const fullCode = printOverride + '\n' + code + '\nreturn _OUTPUT';

                if (lauxlib.luaL_dostring(L, fullCode) !== lua.LUA_OK) {
                    const error = to_jsstring(L, -1);
                    lua.lua_pop(L, 1);
                    lua.lua_close(L);

                    return {
                        success: false,
                        output: '',
                        error: error || 'Lua execution error'
                    };
                }

                // Get output
                if (lua.lua_isstring(L, -1)) {
                    output = to_jsstring(L, -1);
                }

                lua.lua_close(L);

                return {
                    success: true,
                    output: output || '(Program completed with no output)'
                };
            } catch (error: any) {
                return {
                    success: false,
                    output: '',
                    error: formatError(error)
                };
            }
        });

        return { ...result, executionTime };
    }
}

// Singleton instance
const luaRunner = new LuaRunner();

export async function runLua(code: string): Promise<ExecutionResult> {
    return luaRunner.run(code);
}

export async function initLua(): Promise<void> {
    return luaRunner.init();
}

export function isLuaReady(): boolean {
    return luaRunner.isInitialized();
}
