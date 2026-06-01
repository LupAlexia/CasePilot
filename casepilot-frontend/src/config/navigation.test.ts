import { workspaceNavigation } from './navigation';

describe('workspaceNavigation', () => {
  it('conține toate secțiunile principale cu path valid', () => {
    const labels = workspaceNavigation.map((item) => item.label);
    const paths = workspaceNavigation.map((item) => item.path);

    expect(labels).toEqual(['Dashboard', 'Dosare', 'Calendar', 'Asistent AI', 'Profil']);
    expect(paths).toEqual(['/app/dashboard', '/app/dosare', '/app/calendar', '/app/asistent-ai', '/app/profil']);
    expect(workspaceNavigation.every((item) => item.icon != null)).toBe(true);
  });
});
