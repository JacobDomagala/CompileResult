// test/index.test.js   ‑‑ ESM + working mocks
import { jest } from '@jest/globals';

/* stub @actions/core before anyone imports it */
jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn()
}));

process.env.GITHUB_WORKSPACE = '';

/* load mocked core and code under test */
const core = await import('@actions/core');
import fs from 'node:fs';
import { describe } from 'node:test';
const {
  make_dir_universal,
  excluded,
  get_line_info,
  get_line_end,
  is_project_file
} = await import('../index.js');

/* reset after each test */
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

/* ─────────────────────────────────────────── tests */
describe('make_dir_universal', () => {
  it('converts backslashes', () => {
    expect(make_dir_universal('C:\\x\\y')).toBe('C:/x/y');
  });
  it('leaves forward slashes unchanged', () => {
    expect(make_dir_universal('/a/b')).toBe('/a/b');
  });
});

describe('excluded', () => {
  it('true when exclude_dir empty', () =>
    expect(excluded('/x', '')).toBe(false));
  it('false when path starts with excluded dir', () =>
    expect(excluded('/x/y', '/x')).toBe(true));
  it('true when path outside excluded dir', () =>
    expect(excluded('/x/y', '/z')).toBe(false));
});

describe('get_line_end', () => {
  beforeEach(() => core.getInput.mockReturnValue('10'));

  it('caps at start+numLines', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('\n'.repeat(50));
    expect(get_line_end('/f', 10)).toBe('20');
  });

  it('caps at file end', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('\n'.repeat(12));
    expect(get_line_end('/f', 10)).toBe('12');
  });
});

describe('get_line_info', () => {
  beforeEach(() => core.getInput.mockReturnValue('10'));

  it('GCC line parsing', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('\n'.repeat(123));
    expect(get_line_info('GCC', '/p.c:123: error: x'))
      .toEqual(['/p.c', '123', '123', 'error']);
  });

  it('Clang line parsing', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('\n'.repeat(127));
    expect(get_line_info('Clang', '/p.c:123: error: x'))
      .toEqual(['/p.c', '123', '127', 'error']);
  });

  it('MSVC line parsing', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('\n'.repeat(210));
    expect(get_line_info('MSVC', 'C:\\p.cpp(123): warning C420'))
      .toEqual(['C:\\p.cpp', '123', '133', 'warning']);
  });

  describe('is_project_file', () => {
    it('Absolute path but different than prefix', () => {
      expect(is_project_file('/some/abs/path/to/file.cpp', '/my/prefix')).toEqual(false);
    });

    it('Absolute path same as prefix', () => {
      expect(is_project_file('/my/prefix/src/file.cpp', '/my/prefix')).toEqual(true);
    });

    it('Relative path not part of project', () => {
      spy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      expect(is_project_file('src/file.cpp', '/my/prefix')).toEqual(true);
      expect(spy).toHaveBeenCalledWith('/my/prefix/src/file.cpp');
    });

    it('Relative path not part of project', () => {
      spy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      expect(is_project_file('src/file.cpp', '/my/prefix')).toEqual(false);
      expect(spy).toHaveBeenCalledWith('/my/prefix/src/file.cpp');
    });
  });

});
