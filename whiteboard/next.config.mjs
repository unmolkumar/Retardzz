import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.resolve.alias = {
			...(config.resolve.alias || {}),
			yjs: path.resolve(process.cwd(), "node_modules/yjs"),
			tldraw: path.resolve(process.cwd(), "node_modules/tldraw"),
			"@tldraw/tldraw": path.resolve(process.cwd(), "node_modules/@tldraw/tldraw"),
			"@tldraw/editor": path.resolve(process.cwd(), "node_modules/@tldraw/editor"),
			"@tldraw/tlschema": path.resolve(process.cwd(), "node_modules/@tldraw/tlschema"),
			"@tldraw/store": path.resolve(process.cwd(), "node_modules/@tldraw/store"),
			"@tldraw/state": path.resolve(process.cwd(), "node_modules/@tldraw/state"),
			"@tldraw/state-react": path.resolve(process.cwd(), "node_modules/@tldraw/state-react"),
			"@tldraw/utils": path.resolve(process.cwd(), "node_modules/@tldraw/utils"),
			"@tldraw/validate": path.resolve(process.cwd(), "node_modules/@tldraw/validate"),
		};

		return config;
	},
};

export default nextConfig;
