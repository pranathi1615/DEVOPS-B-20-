function ProductCard({ name, price, image, onAddToCart }) {
  return (
    <div className="product-card">
      <img src={image} alt={name} />

      <h3>{name}</h3>

      <p>₹{price}</p>

      <button onClick={() => onAddToCart({ name, price, image })}>
        Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;