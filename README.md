# Compile Result

Compile Result parses C/C++ compiler output and creates or updates a pull request comment with warnings and errors, including links to source files and line snippets.

## Output Example

![output](https://github.com/JacobDomagala/CompileResult/wiki/example_output.png)

## Workflow Example

```yaml
name: Build on Ubuntu

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure
        run: cmake -S . -B build

      - name: Build
        run: cmake --build build 2>&1 | tee build/output.txt

      - name: Post PR comment for warnings/errors
        if: always()
        uses: JacobDomagala/CompileResult@master
        with:
          comment_title: UBUNTU COMPILE RESULT
          compile_result_file: build/output.txt
          compiler: GNU
```

## Inputs

| Name | Required | Description | Default |
|------|----------|-------------|---------|
| `compile_result_file` | Yes | File that contains the compiler output. | `empty` |
| `compiler` | Yes | Compiler used to produce the output (`MSVC`, `GNU`, `CLANG`). | `GNU` |
| `token` | Yes | `GITHUB_TOKEN` or a repo-scoped PAT used to create/update the PR comment. | `${{ github.token }}` |
| `work_dir` | Yes | Workspace root used to map diagnostics to repository files. | `${{ github.workspace }}` |
| `exclude_dir` | No | Full path to directory that should be ignored. | `<empty>` |
| `pull_request_number` | Yes | Pull request number to post/update the comment on. | `${{ github.event.pull_request.number }}` |
| `comment_title` | Yes | Title shown in the PR comment and used to find/update an existing bot comment. | `COMPILE RESULT` |
| `num_lines_to_display` | No | Number of lines shown in each code snippet. | `5` |
| `debug_output` | No | Print debug logs while parsing output. | `false` |
| `server_url` | No | GitHub/GitHub Enterprise server URL. | `https://github.com` |
