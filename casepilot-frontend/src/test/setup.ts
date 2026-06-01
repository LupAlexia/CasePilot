import '@testing-library/jest-dom';

class MockIntersectionObserver {
	root: Element | null = null;

	rootMargin = '';

	thresholds: ReadonlyArray<number> = [];

	observe() {}

	unobserve() {}

	disconnect() {}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
	writable: true,
	configurable: true,
	value: MockIntersectionObserver
});
