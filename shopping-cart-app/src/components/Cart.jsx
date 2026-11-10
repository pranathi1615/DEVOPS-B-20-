function Cart({ cart, onRemove }) {
  const total = cart.reduce((sum, product) => sum + product.price, 0);

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <p>Cart is Empty</p>
      ) : (
        <>
          {cart.map((product, index) => (
            <div className="cart-item" key={index}>
              <span>
                {product.name} - ₹{product.price}
              </span>

              <button onClick={() => onRemove(index)}>
                Remove
              </button>
            </div>
          ))}

          <h3>Total: ₹{total}</h3>
        </>
      )}
    </div>
  );
}

export default Cart;