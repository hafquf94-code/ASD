import Link from "next/link"
import { Navbar } from "@/components/ecommerce/navbar"
import { Footer } from "@/components/ecommerce/footer"
import { WhatsAppButton } from "@/components/ecommerce/whatsapp-button"
import { Breadcrumb } from "@/components/ecommerce/breadcrumb"
import { ProductImageGallery } from "@/components/ecommerce/product-image-gallery"
import { ProductInfo } from "@/components/ecommerce/product-info"
import { ProductTabs } from "@/components/ecommerce/product-tabs"
import { RelatedProducts } from "@/components/ecommerce/related-products"
import { Button } from "@/components/ui/button"
import { ECOMMERCE_PRODUCTS, getProductsByCategory } from "@/lib/ecommerce-mock-data"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = ECOMMERCE_PRODUCTS.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Get related products from the same category
  const relatedProducts = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Shop", href: "/shop" },
            { label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/shop?category=${product.category}` },
            { label: product.name },
          ]}
        />

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left: Image Gallery */}
          <ProductImageGallery mainImage={product.image} productName={product.name} />

          {/* Right: Product Info */}
          <ProductInfo product={product} />
        </div>

        {/* Product Tabs */}
        <ProductTabs product={product} />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
