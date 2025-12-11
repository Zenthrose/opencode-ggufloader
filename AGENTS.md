# Commands

- Build: `bun run build` (packages/opencode) or `bun turbo build`
- Build ncnn-vulkan binding: `set PATH=C:\msys64\mingw64\bin;%PATH% && cd packages/opencode/src/ncnn-binding && rmdir /s /q build 2>nul && C:\msys64\mingw64\bin\cmake.exe -B build -G Ninja -DCMAKE_CXX_COMPILER=C:\msys64\mingw64\bin\g++.exe -DCMAKE_C_COMPILER=C:\msys64\mingw64\bin\gcc.exe && C:\msys64\mingw64\bin\cmake.exe --build build --config Release -j 2`
- Test: `bun test` (single package) or `bun turbo test` (all packages)
- Typecheck: `bun typecheck` (single package) or `bun turbo typecheck` (all packages)
- Dev: `bun dev` (packages/opencode)
- Run single test: `bun test <test-file>.test.ts`

# Code Style

- **Formatting**: Prettier (no semicolons, 120 char width), EditorConfig (2 spaces, 80 max line length)
- **Types**: Strict TypeScript, avoid `any`, use Zod for validation
- **Imports**: External packages first, then relative imports
- **Variables**: Prefer `const`, single-word names where possible, avoid unnecessary destructuring
- **Functions**: Keep in one function unless composable/reusable
- **Error Handling**: Avoid `try`/`catch` where possible, avoid `else` statements
- **APIs**: Prefer Bun APIs (Bun.file(), etc.) over Node.js equivalents

# Tool Calling

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE. Example for 3 parallel file reads:

```json
{
  "recipient_name": "multi_tool_use.parallel",
  "parameters": {
    "tool_uses": [
      { "recipient_name": "functions.read", "parameters": { "filePath": "path/to/file.tsx" } },
      { "recipient_name": "functions.read", "parameters": { "filePath": "path/to/file.ts" } },
      { "recipient_name": "functions.read", "parameters": { "filePath": "path/to/file.md" } }
    ]
  }
}
```
