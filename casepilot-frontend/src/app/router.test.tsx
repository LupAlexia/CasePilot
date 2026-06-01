import { appRouter } from './router';

describe('appRouter', () => {
  it('definește rutele principale ale aplicației', () => {
    const root = appRouter.routes.find((route) => route.path === '/');
    const app = appRouter.routes.find((route) => route.path === '/app');
    const login = appRouter.routes.find((route) => route.path === '/login');
    const register = appRouter.routes.find((route) => route.path === '/register');

    expect(root).toBeDefined();
    expect(app).toBeDefined();
    expect(login).toBeDefined();
    expect(register).toBeDefined();
    expect(root?.children?.[0]?.index).toBe(true);
    expect(root?.children?.map((child) => child.path).filter(Boolean)).toEqual([]);

    const appPaths = app?.children?.map((child) => child.path).filter(Boolean);
    expect(appPaths).toEqual(['dashboard', 'dosare', 'dosare/:caseId', 'calendar', 'asistent-ai', 'profil', 'admin/utilizatori', 'admin/audit', 'admin/supraveghere']);
  });
});
