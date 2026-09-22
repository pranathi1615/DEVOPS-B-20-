import { useState } from "react";

import Header from "./components/Header";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import Footer from "./components/Footer";

function App() {
  const [cart, setCart] = useState([]);

  const products = [
    {
      id: 1,
      name: "Laptop",
      price: 55000,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
    },
    {
      id: 2,
      name: "Headphones",
      price: 2500,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
      id: 3,
      name: "Smartphone",
      price: 25000,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"
    },
    {
      id: 4,
      name: "Smart Watch",
      price: 5000,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    }
  ];

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Header cartCount={cart.length} />

      <main>
        <h2>Welcome to Online Shopping</h2>

        <ProductList
          products={products}
          onAddToCart={addToCart}
        />

        <Cart
          cart={cart}
          onRemove={removeFromCart}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;