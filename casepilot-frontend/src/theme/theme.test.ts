import { appTheme } from './theme';

describe('appTheme', () => {
  it('are configurația principală de paletă și tipografie', () => {
    expect(appTheme.palette.primary.main).toBe('#1f4e8c');
    expect(appTheme.palette.background.default).toBe('#eef3f9');
    expect(appTheme.shape.borderRadius).toBe(16);
    expect(appTheme.typography.h1?.fontFamily).toContain('Merriweather');
  });
});
