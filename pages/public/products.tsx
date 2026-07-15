import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { useEffect, useMemo, useState } from "react";
import SearchIcon from "@/components/icons/search";
import { toast } from "@/lib/toast";
import { addPublicCartItem, productToCartItem } from "@/lib/publicCart";
import { getStoredCustomer } from "@/services/publicCustomerService";
import {
	fetchPublicProducts,
	fetchPublicCategories,
	groupByCategory,
	getCategoryId,
	getProductCategoryId,
	resolveProductImageUrl,
	type Product,
	type ProductCategory,
} from "@/services/publicProductService";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	pageData: any;
	products: Product[];
	categories: ProductCategory[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductsPublicPage({ products, categories, pageData }: Props) {
	const [clientProducts, setClientProducts] = useState<Product[]>(
	(products ?? []).filter((p) => (p.status ?? "active") === "active")
	);
	const [clientCategories, setClientCategories] = useState<ProductCategory[]>(categories ?? []);
	const [activeCategory, setActiveCategory] = useState<string>("*");
	const [search, setSearch] = useState<string>("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [loading, setLoading] = useState(!products?.length && !categories?.length);

	useEffect(() => {
		setClientProducts((products ?? []).filter((p) => (p.status ?? "active") === "active"));
		setClientCategories(categories ?? []);
	}, [products, categories]);

	// Client-side fallback fetch
	useEffect(() => {
		if (products?.length || categories?.length) return;

		let cancelled = false;
		setLoading(true);
		(async () => {
			try {
				const [nextProducts, nextCategories] = await Promise.all([
					fetchPublicProducts(),
					fetchPublicCategories(),
				]);
				// In the client-side fallback fetch:
				if (!cancelled) {
					setClientProducts(nextProducts.filter((p) => (p.status ?? "active") === "active"));
					setClientCategories(nextCategories);
				}
			} catch {
				// silently ignore — page already shows empty state
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => { cancelled = true; };
	}, [products, categories]);

	// ── Derived state ──────────────────────────────────────────────────────────

	const searchedProducts = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return clientProducts;
		return clientProducts.filter((p) => {
			const haystack = [
				p.name, p.title, p.slug, p.description,
				p.teaser, p.summary, p.category?.name,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [search, clientProducts]);

	const byCat = useMemo(() => groupByCategory(searchedProducts), [searchedProducts]);

	const filteredProducts = useMemo(() => {
		if (activeCategory === "*") return searchedProducts;
		return byCat[activeCategory] ?? [];
	}, [activeCategory, searchedProducts, byCat]);

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="container px-0">
			<div className="row">

				{/* ── Sidebar ── */}
				<div className="col-md-4 col-lg-3">
					<div className="sidebar2 p-t-80 p-b-80 p-r-20 p-r-0-md p-t-0-md">

						{/* Search */}
						<div className="search-sidebar2 size12 bo2 pos-relative" style={{ marginBottom: 24 }}>
							<input
								className="input-search-sidebar2 txt10 p-l-20 p-r-55"
								type="text"
								placeholder="Search products"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyDown={(e) => e.key === "Escape" && setSearch("")}
							/>
							<button
								type="button"
								className="btn-search-sidebar2 flex-c-m ti-search trans-0-4"
								aria-label="Search"
							>
								<SearchIcon />
							</button>
						</div>

						{/* Category filter */}
						<div className="categories">
							<h4 className="txt33 bo5-b p-b-35 p-t-58">Brands</h4>
							<ul>
								<li className="flex-sb-m bo5-b p-t-8 p-b-8">
									<a
										className={`txt27 ${activeCategory === "*" ? "color0" : "color1"} color0-hov`}
										style={{ cursor: "pointer", textDecoration: "none" }}
										onClick={() => setActiveCategory("*")}
									>
										All Brands
									</a>
									<span className="txt29">({searchedProducts.length})</span>
								</li>

								{clientCategories.map((c) => {
									const catId = getCategoryId(c);
									const label = c.name ?? c.title ?? c.slug ?? "Category";
									return (
										<li key={catId} className="flex-sb-m bo5-b p-t-8 p-b-8">
											<a
												className={`txt27 ${activeCategory === catId ? "color0" : "color1"} color0-hov`}
												style={{ cursor: "pointer", textDecoration: "none" }}
												onClick={() => setActiveCategory(catId)}
											>
												{label}
											</a>
											<span className="txt29">({(byCat[catId] ?? []).length})</span>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				{/* ── Main content ── */}
				<div className="col-md-8 col-lg-9">
					<div className="p-t-80 p-b-80">

						{/* Header + view toggle */}
						<div
							className="p-b-50 d-flex align-items-start justify-content-between flex-wrap"
							style={{ gap: 12 }}
						>
							<div>
								<h3 className="txt33">Products</h3>
								<p className="txt14 m-t-10">
									{pageData?.title ? `Explore ${pageData.title}` : "Explore our latest items"}
								</p>
							</div>

							<div className="d-flex align-items-center" style={{ gap: 8 }}>
								<span className="txt27">View</span>
								<div className="btn-group" role="group" aria-label="Products view mode">
									<button
										type="button"
										onClick={() => setViewMode("grid")}
										className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
										aria-pressed={viewMode === "grid"}
										title="Grid view"
									>
										<GridIcon />
									</button>
									<button
										type="button"
										onClick={() => setViewMode("list")}
										className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-outline-secondary"}`}
										aria-pressed={viewMode === "list"}
										title="List view"
									>
										<ListIcon />
									</button>
								</div>
							</div>
						</div>

						{/* Product grid / list / loading / empty */}
						{loading ? (
							<div
								className="d-flex flex-column align-items-center justify-content-center py-5"
								style={{ gap: 14, minHeight: 200 }}
							>
								<div
									className="spinner-border"
									role="status"
									style={{ width: 36, height: 36, borderWidth: 3, color: "#ec1d25" }}
								>
									<span className="visually-hidden">Loading…</span>
								</div>
								<p className="txt14" style={{ color: "#999", margin: 0 }}>
									Fetching products…
								</p>
							</div>
						) : filteredProducts.length ? (
							<div className="row">
								{filteredProducts.map((p) => (
									<ProductCard key={p.id ?? p.slug} product={p} viewMode={viewMode} />
								))}
							</div>
						) : (
							<div
								className="d-flex flex-column align-items-center py-5"
								style={{ gap: 10 }}
							>
								<p className="txt14" style={{ color: "#999", margin: 0 }}>
									{search
										? `No products match "${search}".`
										: "No products found."}
								</p>
								{search && (
									<button
										className="btn btn-sm btn-outline-secondary"
										onClick={() => setSearch("")}
									>
										Clear search
									</button>
								)}
							</div>
						)}

					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProductCard({ product: p, viewMode }: { product: Product; viewMode: "grid" | "list" }) {
	const href = `/public/product/${p.slug ?? p.id}`;
	const imageSrc = resolveProductImageUrl(p.image_url ?? p.image);
	const label = p.name ?? p.title ?? p.slug ?? "";
	const blurb = String(p.description ?? p.teaser ?? p.summary ?? "");
	const price = p.price
		? Number(p.price).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
		: null;
	const addToCart = () => {
		if (!getStoredCustomer()) {
			window.location.href = `/public/login?redirect=${encodeURIComponent("/public/products")}`;
			return;
		}
		addPublicCartItem(productToCartItem(p, 1));
		toast.success("Added to cart");
	};

	return (
		<div className={`${viewMode === "grid" ? "col-sm-6 col-lg-4" : "col-12"} p-b-40`}>
			<a href={href} className="dis-block link-reset" style={{ width: "100%" }}>
				<div className="blo4 bo-rad-10 of-hidden" style={{ display: "flex", flexDirection: "column" }}>
					{viewMode === "grid" ? (
						<>
							<div className="hov-img-zoom" style={{ aspectRatio: "4 / 3", overflow: "hidden" }}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={imageSrc}
									alt={label}
									style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
									onError={(e) => {
										(e.target as HTMLImageElement).src = "/images/logo.png";
									}}
								/>
							</div>
							<div className="p-20" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
								<h4 className="p-b-10" style={{ marginTop: 8 }}>{label}</h4>
								{price && (
									<p className="color0" style={{ fontWeight: 700, marginBottom: 6 }}>
										{price}
									</p>
								)}
								<p className="txt14" style={lineClamp(3)}>{blurb}</p>
								<span className="txt4 color0-hov" style={{ marginTop: "auto" }}>
									View Details →
								</span>
							</div>
						</>
					) : (
						<div className="row g-0">
							<div className="col-md-5">
								<div className="hov-img-zoom" style={{ height: 220, overflow: "hidden" }}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={imageSrc}
										alt={label}
										style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
										onError={(e) => {
											(e.target as HTMLImageElement).src = "/images/logo.png";
										}}
									/>
								</div>
							</div>
							<div className="col-md-7 ps-md-4">
								<div className="p-20" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
									<h4 className="p-b-10" style={{ marginTop: 8 }}>{label}</h4>
									{price && (
										<p className="color0" style={{ fontWeight: 700, marginBottom: 6 }}>
											{price}
										</p>
									)}
									<p className="txt14" style={lineClamp(4)}>{blurb}</p>
									<span className="txt4 color0-hov" style={{ marginTop: "auto" }}>
										View Details →
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</a>
			<button
				type="button"
				className="btn btn-success btn-sm"
				onClick={addToCart}
				style={{ width: "100%", marginTop: 10, minHeight: 38, fontWeight: 700 }}
			>
				Add to Cart
			</button>
		</div>
	);
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function GridIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
			<rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
			<rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
			<rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

function ListIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

function lineClamp(lines: number): React.CSSProperties {
	return {
		display: "-webkit-box",
		WebkitLineClamp: lines,
		WebkitBoxOrient: "vertical",
		overflow: "hidden",
	};
}

// ─── SSR ─────────────────────────────────────────────────────────────────────

export async function getServerSideProps() {
  try {
    const [pageRes, products, categories] = await Promise.all([
      getPublicPageBySlug("products"),
      fetchPublicProducts(),
      fetchPublicCategories(),
    ]);

    return {
      props: {
        pageData: pageRes.data ?? null,
        products: (products ?? []).filter((p: Product) => (p.status ?? "active") === "active"), // ← add filter
        categories,
      },
    };
  } catch (error: any) {
    console.error("PUBLIC PRODUCTS SSR ERROR:", error?.response?.data ?? error);
    return {
      props: { pageData: null, products: [], categories: [] },
    };
  }
}

ProductsPublicPage.Layout = LandingPageLayout;
