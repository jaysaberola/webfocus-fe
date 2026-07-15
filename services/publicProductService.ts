import { axiosInstance } from "@/services/axios";

export interface ProductCategory {
	id: number | string;
	name: string;
	slug?: string;
	title?: string;
}

export interface Product {
	id: number | string;
	slug?: string;
	name?: string;
	title?: string;
	description?: string;
	teaser?: string;
	summary?: string;
	price?: number | string;
	image_url?: string;
	image?: string;
	category_id?: number | string;
	category?: ProductCategory;
	status?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractArray(payload: any): any[] {
	if (!payload) return [];
	let data: any = payload?.data ?? payload;

	// Unwrap up to two levels of { data: { data: [...] } }
	for (let i = 0; i < 2; i++) {
		if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
			data = data.data;
		}
	}

	if (Array.isArray(data)) return data;

	const keys = ["items", "rows", "results", "result", "products", "categories", "product_categories", "productCategories", "productCategory"];
	for (const key of keys) {
		if (Array.isArray(data?.[key])) return data[key];
		if (Array.isArray(data?.[key]?.data)) return data[key].data;
	}

	return [];
}

async function tryEndpoints(endpoints: string[], params?: Record<string, any>): Promise<any[]> {
	for (const ep of endpoints) {
		try {
			const resp = await axiosInstance.get(ep, {
				params,
				headers: { "X-No-Loading": true },
			});
			const result = extractArray(resp.data);
			if (result.length) return result;
		} catch {
			// continue to next endpoint
		}
	}
	return [];
}

// ─── Public API ─────────────────────────────────────────────────────────────

const PRODUCT_ENDPOINTS = [
	"/public-products",
	"/public/products",
];

const CATEGORY_ENDPOINTS = [
	"/public-product-categories",
	"/public/product-categories",
];

export async function fetchPublicProducts(): Promise<Product[]> {
	return tryEndpoints(PRODUCT_ENDPOINTS, { per_page: 1000 });
}

export async function fetchPublicCategories(): Promise<ProductCategory[]> {
	return tryEndpoints(CATEGORY_ENDPOINTS, { per_page: 1000 });
}

export function getCategoryId(c: ProductCategory): string {
	return String(c?.id ?? c?.slug ?? c?.name ?? "");
}

export function getProductCategoryId(p: Product): string {
	return String(
		p?.category_id ??
		p?.category?.id ??
		"_uncategorized"
	);
}

export function groupByCategory(products: Product[]): Record<string, Product[]> {
	return products.reduce<Record<string, Product[]>>((acc, p) => {
		const key = getProductCategoryId(p);
		if (!acc[key]) acc[key] = [];
		acc[key].push(p);
		return acc;
	}, {});
}

export function resolveProductImageUrl(src: any): string {
	if (!src) return "/images/logo.png";
	let s = String(src).trim().replace(/\\/g, "/");
	if (!s) return "/images/logo.png";

	// Absolute / data / blob URLs
	if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;

	// Leaked Windows absolute paths (e.g. C:/…/public/images/x.jpg)
	if (/^[a-zA-Z]:\//.test(s)) {
		const idx = s.toLowerCase().lastIndexOf("/public/images/");
		if (idx >= 0) return `/images/${s.slice(idx + "/public/images/".length)}`;
		const basename = s.split("/").pop() ?? "";
		return basename ? `/images/${basename}` : "/images/logo.png";
	}

	if (s.includes("/public/images/")) return `/images/${s.split("/public/images/").pop()}`;

	// Common relative public paths
	if (/^\.?\/?images\/|^\.?\/?img\/|^\.?\/?icons\//.test(s)) return `/${s.replace(/^\.\//, "")}`;
	if (s.startsWith("/images/") || s.startsWith("/img/") || s.startsWith("/icons/") || s.startsWith("/_next/")) return s;

	const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

	if (s.startsWith("/storage/") || s.startsWith("/uploads/")) return base ? `${base}${s}` : s;
	if (s.startsWith("storage/") || s.startsWith("uploads/")) return base ? `${base}/${s}` : `/${s}`;

	// Bare filename with image extension
	if (!s.includes("/") && /\.(png|jpe?g|webp|gif|svg)$/i.test(s)) {
		return `/images/${s.replace(/\.webp$/i, ".jpg")}`;
	}

	if (s.startsWith("/")) return s;

	return base ? `${base}/storage/${s.replace(/^\.?\/?/, "")}` : s;
}
