function Header({ cartCount }) {
  return (
    <header>
      <h1>Online Shopping</h1>

      <div>
        🛒 Cart: {cartCount}
      </div>
    </header>
  );
}

export default Header;