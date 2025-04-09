export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    sizes: string[];
    category: string;
  }
  
  export interface CartItem extends Product {
    quantity: number;
    selectedSize: string;
  }
  
  export interface User {
    email: string;
    name: string;
    address?: string;
  }