/**
 * @jest-environment jsdom
 */
import { mount } from '@vue/test-utils';
import { Icon, loadIcons, iconExists } from '../../';
import { mockAPIData } from '@iconify/core/lib/api/modules/mock';
import { provider, nextPrefix } from './load';

const iconData = {
	body: '<path d="M4 19h16v2H4zm5-4h11v2H9zm-5-4h16v2H4zm0-8h16v2H4zm5 4h11v2H9z" fill="currentColor"/>',
	width: 24,
	height: 24,
};

describe('Rendering icon', () => {
	test('rendering icon after loading it', (done) => {
		const prefix = nextPrefix();
		const name = 'render-test';
		const iconName = `@${provider}:${prefix}:${name}`;
		const className = `iconify iconify--${prefix} iconify--${provider}`;
		let onLoadCalled = false;

		mockAPIData({
			type: 'icons',
			provider,
			prefix,
			response: {
				prefix,
				icons: {
					[name]: iconData,
				},
			},
		});

		// Check if icon has been loaded
		expect(iconExists(iconName)).toEqual(false);

		// Load icon
		loadIcons([iconName], (loaded, missing, pending) => {
			// Make sure icon has been loaded
			expect(loaded).toMatchObject([
				{
					provider,
					prefix,
					name,
				},
			]);
			expect(missing).toMatchObject([]);
			expect(pending).toMatchObject([]);
			expect(iconExists(iconName)).toEqual(true);

			// Render component
			const Wrapper = {
				components: { Icon },
				// Also test class string
				template: `<Icon icon="${iconName}" :onLoad="onLoad" class="test" />`,
				methods: {
					onLoad(name) {
						expect(name).toEqual(iconName);
						expect(onLoadCalled).toEqual(false);
						onLoadCalled = true;
					},
				},
			};
			const wrapper = mount(Wrapper, {});
			const html = wrapper.html().replace(/\s*\n\s*/g, '');

			// Check HTML
			expect(html).toEqual(
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="test ' +
					className +
					'" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M4 19h16v2H4zm5-4h11v2H9zm-5-4h16v2H4zm0-8h16v2H4zm5 4h11v2H9z" fill="currentColor"></path></svg>'
			);

			// Make sure onLoad has been called
			expect(onLoadCalled).toEqual(true);

			done();
		});
	});

	test('rendering icon before loading it', (done) => {
		const prefix = nextPrefix();
		const name = 'mock-test';
		const iconName = `@${provider}:${prefix}:${name}`;
		const className = `iconify iconify--${prefix} iconify--${provider}`;
		let onLoadCalled = false;

		mockAPIData({
			type: 'icons',
			provider,
			prefix,
			response: {
				prefix,
				icons: {
					[name]: iconData,
				},
			},
			delay: (next) => {
				// Icon should not have loaded yet
				expect(iconExists(iconName)).toEqual(false);

				// onLoad should not have been called yet
				expect(onLoadCalled).toEqual(false);

				// Send icon data
				next();

				// Test it again
				expect(iconExists(iconName)).toEqual(true);

				// Check if state was changed
				// Wrapped in double setTimeout() because re-render takes 2 ticks
				setTimeout(() => {
					setTimeout(() => {
						// Check HTML
						expect(wrapper.html().replace(/\s*\n\s*/g, '')).toEqual(
							'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="foo ' +
								className +
								'" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M4 19h16v2H4zm5-4h11v2H9zm-5-4h16v2H4zm0-8h16v2H4zm5 4h11v2H9z" fill="currentColor"></path></svg>'
						);

						// onLoad should have been called
						expect(onLoadCalled).toEqual(true);

						done();
					}, 0);
				}, 0);
			},
		});

		// Check if icon has been loaded
		expect(iconExists(iconName)).toEqual(false);

		// Render component
		const Wrapper = {
			components: { Icon },
			template: `<Icon icon="${iconName}" :onLoad="onLoad" :class="testClass" />`,
			methods: {
				onLoad(name) {
					expect(name).toEqual(iconName);
					expect(onLoadCalled).toEqual(false);
					onLoadCalled = true;
				},
			},
			data() {
				// Test dynamic class
				return {
					testClass: {
						foo: true,
						bar: false,
					},
				};
			},
		};
		const wrapper = mount(Wrapper, {});

		// Should render empty icon
		expect(wrapper.html()).toEqual('<!---->');

		// onLoad should not have been called yet
		expect(onLoadCalled).toEqual(false);
	});

	test('missing icon', (done) => {
		const prefix = nextPrefix();
		const name = 'missing-icon';
		const iconName = `@${provider}:${prefix}:${name}`;
		mockAPIData({
			type: 'icons',
			provider,
			prefix,
			response: 404,
			delay: (next) => {
				// Icon should not have loaded yet
				expect(iconExists(iconName)).toEqual(false);

				// Send icon data
				next();

				// Test it again
				expect(iconExists(iconName)).toEqual(false);

				// Check if state was changed
				// Wrapped in double setTimeout() because re-render takes 2 ticks
				setTimeout(() => {
					setTimeout(() => {
						expect(wrapper.html()).toEqual('<!---->');

						done();
					}, 0);
				}, 0);
			},
		});

		// Check if icon has been loaded
		expect(iconExists(iconName)).toEqual(false);

		// Render component
		const Wrapper = {
			components: { Icon },
			template: `<Icon icon="${iconName}" :onLoad='onLoad' />`,
			methods: {
				onLoad() {
					throw new Error('onLoad called for empty icon!');
				},
			},
		};
		const wrapper = mount(Wrapper, {});

		// Should render empty icon
		expect(wrapper.html()).toEqual('<!---->');
	});
});
