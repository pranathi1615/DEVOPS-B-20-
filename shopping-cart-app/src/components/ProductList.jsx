import ProductCard from "./ProductCard";

function ProductList({ products, onAddToCart }) {
  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          price={product.price}
          image={product.image}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

export default ProductList;