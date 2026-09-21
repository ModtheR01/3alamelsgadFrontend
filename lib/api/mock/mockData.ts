import { UserManagementUser, Address, UserRole } from '@/types/auth';

export interface MockUserRecord extends UserManagementUser {
  password: string;
  deleted_at?: string | null;
}

export const INITIAL_MOCK_USERS: MockUserRecord[] = [
  {
    id: 1,
    first_name: 'Anas',
    last_name: 'Sayed',
    email: 'anas@example.com',
    phone: '01012345678',
    role: 'CUSTOMER',
    is_active: true,
    created_at: '2026-09-18T12:00:00Z',
    password: 'password123',
    deleted_at: null,
  },
  {
    id: 2,
    first_name: 'Karim',
    last_name: 'Mansour',
    email: 'karim.mansour@example.com',
    phone: '01009876543',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-09-15T09:30:00Z',
    password: 'password123',
    deleted_at: null,
  },
  {
    id: 3,
    first_name: 'Leila',
    last_name: 'Al-Sabah',
    email: 'leila.sabah@example.com',
    phone: '01023456789',
    role: 'MODERATOR',
    is_active: true,
    created_at: '2026-09-10T14:20:00Z',
    password: 'password123',
    deleted_at: null,
  },
  {
    id: 4,
    first_name: 'Omar',
    last_name: 'Tarek',
    email: 'omar.tarek@example.com',
    phone: '01034567890',
    role: 'CUSTOMER',
    is_active: false,
    created_at: '2026-08-20T11:15:00Z',
    password: 'password123',
    deleted_at: '2026-09-01T10:00:00Z',
  },
];

export interface MockAddressRecord extends Address {
  user_id: number;
  created_at: string;
}

export const INITIAL_MOCK_ADDRESSES: MockAddressRecord[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Home',
    country: 'Egypt',
    city: 'Cairo',
    street: 'El Narges 3',
    building_number: '18',
    apartment_number: '5',
    is_default: true,
    created_at: '2026-09-18T12:05:00Z',
  },
  {
    id: 2,
    user_id: 1,
    title: 'Sahel Summer Villa',
    country: 'Egypt',
    city: 'Matrouh',
    street: 'Catania Village, Villa 42',
    building_number: '42',
    apartment_number: '1',
    is_default: false,
    created_at: '2026-09-18T12:10:00Z',
  },
  {
    id: 3,
    user_id: 2,
    title: 'Zamalek Penthouse',
    country: 'Egypt',
    city: 'Cairo',
    street: 'Gezira St',
    building_number: '12',
    apartment_number: '101',
    is_default: true,
    created_at: '2026-09-15T09:35:00Z',
  },
  {
    id: 4,
    user_id: 3,
    title: 'Maadi Atelier Studio',
    country: 'Egypt',
    city: 'Cairo',
    street: 'Road 213, Degla',
    building_number: '7',
    apartment_number: '3',
    is_default: true,
    created_at: '2026-09-10T14:25:00Z',
  },
];

export interface MockCategoryRecord {
  id: number;
  name: string;
  image: string | null;
  public_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export const INITIAL_MOCK_CATEGORIES: MockCategoryRecord[] = [
  {
    id: 1,
    name: 'Tables',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/tables_main',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-15T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 2,
    name: 'Chairs & Loungers',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/chairs_main',
    created_at: '2026-08-02T10:00:00Z',
    updated_at: '2026-08-16T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 3,
    name: 'Sculptural Pieces',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/sculptural_main',
    created_at: '2026-08-03T10:00:00Z',
    updated_at: '2026-08-17T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 4,
    name: 'Decorative Objects',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/decorative_main',
    created_at: '2026-08-04T10:00:00Z',
    updated_at: '2026-08-18T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 5,
    name: 'Architectural Lighting',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/lighting_main',
    created_at: '2026-08-05T10:00:00Z',
    updated_at: '2026-08-19T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 6,
    name: 'Outdoor & Coastal',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/outdoor_main',
    created_at: '2026-08-06T10:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 7,
    name: 'Experimental Prototypes (Archived)',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
    public_id: 'tocco/categories/proto_archived',
    created_at: '2026-07-15T09:00:00Z',
    updated_at: '2026-08-25T11:00:00Z',
    deleted_at: '2026-09-01T10:00:00Z', // Soft-deleted category for testing restore
  },
];

export interface MockSubcategoryRecord {
  id: number;
  category_id: number;
  name: string;
  image: string | null;
  public_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const INITIAL_MOCK_SUBCATEGORIES: MockSubcategoryRecord[] = [
  {
    id: 1,
    category_id: 1, // Tables
    name: 'Coffee Tables',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/coffee_tables',
    created_at: '2026-08-01T11:00:00Z',
    updated_at: '2026-08-01T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 2,
    category_id: 1, // Tables
    name: 'Dining Tables',
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/dining_tables',
    created_at: '2026-08-01T11:30:00Z',
    updated_at: '2026-08-01T11:30:00Z',
    deleted_at: null,
  },
  {
    id: 3,
    category_id: 1, // Tables
    name: 'Side & Accent Tables',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/side_tables',
    created_at: '2026-08-01T12:00:00Z',
    updated_at: '2026-08-01T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 4,
    category_id: 2, // Chairs & Loungers
    name: 'Lounge Chairs',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/lounge_chairs',
    created_at: '2026-08-02T11:00:00Z',
    updated_at: '2026-08-02T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 5,
    category_id: 2, // Chairs & Loungers
    name: 'Chaise Lounges',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/chaise_lounges',
    created_at: '2026-08-02T11:30:00Z',
    updated_at: '2026-08-02T11:30:00Z',
    deleted_at: null,
  },
  {
    id: 6,
    category_id: 3, // Sculptural Pieces
    name: 'Monolithic Pedestals',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/monoliths',
    created_at: '2026-08-03T11:00:00Z',
    updated_at: '2026-08-03T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 7,
    category_id: 3, // Sculptural Pieces
    name: 'Totemic Forms',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/totems',
    created_at: '2026-08-03T11:30:00Z',
    updated_at: '2026-08-03T11:30:00Z',
    deleted_at: null,
  },
  {
    id: 8,
    category_id: 4, // Decorative Objects
    name: 'Artisanal Vessels',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    public_id: 'tocco/subcategories/vessels',
    created_at: '2026-08-04T11:00:00Z',
    updated_at: '2026-08-04T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 9,
    category_id: 4, // Decorative Objects
    name: 'Terracotta Urns (Archived)',
    image: null,
    public_id: null,
    created_at: '2026-08-04T12:00:00Z',
    updated_at: '2026-08-20T15:00:00Z',
    deleted_at: '2026-09-02T11:00:00Z', // Soft-deleted subcategory for testing restore
  },
];

// ==========================================
// MOCK COLORS
// ==========================================
import { BackendColor, BackendProductImage, BackendProduct } from '@/types/product';
import { BackendCart, BackendCartItem } from '@/types/cart';

export const INITIAL_MOCK_COLORS: BackendColor[] = [
  {
    id: 1,
    name: 'Alabaster Bone',
    hex_code: '#EBE3D5',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Terracotta Earth',
    hex_code: '#A85A3C',
    created_at: '2026-08-01T10:05:00Z',
    updated_at: '2026-08-01T10:05:00Z',
  },
  {
    id: 3,
    name: 'Basalt Black',
    hex_code: '#1F1E1D',
    created_at: '2026-08-01T10:10:00Z',
    updated_at: '2026-08-01T10:10:00Z',
  },
  {
    id: 4,
    name: 'Sahara Dune',
    hex_code: '#D8C7B0',
    created_at: '2026-08-01T10:15:00Z',
    updated_at: '2026-08-01T10:15:00Z',
  },
  {
    id: 5,
    name: 'Sage Whisper',
    hex_code: '#9EAA94',
    created_at: '2026-08-01T10:20:00Z',
    updated_at: '2026-08-01T10:20:00Z',
  },
];

// ==========================================
// MOCK PRODUCT IMAGES
// ==========================================
export const INITIAL_MOCK_PRODUCT_IMAGES: BackendProductImage[] = [
  {
    id: 1,
    product: 1,
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/dune_coffee_primary',
    is_primary: true,
    sort_order: 0,
    created_at: '2026-08-05T10:00:00Z',
  },
  {
    id: 2,
    product: 1,
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/dune_coffee_angle',
    is_primary: false,
    sort_order: 1,
    created_at: '2026-08-05T10:05:00Z',
  },
  {
    id: 3,
    product: 2,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/oasis_lounge_primary',
    is_primary: true,
    sort_order: 0,
    created_at: '2026-08-06T10:00:00Z',
  },
  {
    id: 4,
    product: 3,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/monolith_dining_primary',
    is_primary: true,
    sort_order: 0,
    created_at: '2026-08-07T10:00:00Z',
  },
  {
    id: 5,
    product: 4,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/sculptural_vessel_primary',
    is_primary: true,
    sort_order: 0,
    created_at: '2026-08-08T10:00:00Z',
  },
  {
    id: 6,
    product: 5,
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85',
    public_id: 'tocco/products/archived_proto_img',
    is_primary: true,
    sort_order: 0,
    created_at: '2026-07-20T10:00:00Z',
  },
];

// ==========================================
// MOCK PRODUCTS
// ==========================================
export const INITIAL_MOCK_PRODUCTS: BackendProduct[] = [
  {
    id: 1,
    name: 'The Dune Low Coffee Table',
    description: 'A low-slung, organic centerpiece crafted from marine-grade fiberglass with fluid contours and a monolithic presence.',
    dimensions: '140 x 85 x 34 cm',
    height: '34.00',
    price: '28500.00',
    delivery_date: '2026-10-15',
    material: 'Reinforced marine-grade fiberglass with UV-stable gelcoat',
    finish: 'Matte Sanded Texture',
    faq: [
      {
        question: 'Can this piece be placed outdoors or by poolside?',
        answer: 'Yes, our marine-grade fiberglass is completely weather-resistant, UV-stabilized, and impervious to saltwater and humidity.',
      },
      {
        question: 'What is the recommended cleaning routine?',
        answer: 'Gently wipe with a soft microfiber cloth and pH-neutral soapy water. Avoid harsh acetone or abrasive scourers.',
      },
    ],
    subcategory_ids: [1], // Coffee Tables
    colors: [INITIAL_MOCK_COLORS[0], INITIAL_MOCK_COLORS[1], INITIAL_MOCK_COLORS[3]],
    color_ids: [1, 2, 4],
    images: [INITIAL_MOCK_PRODUCT_IMAGES[0], INITIAL_MOCK_PRODUCT_IMAGES[1]],
    created_at: '2026-08-05T10:00:00Z',
    updated_at: '2026-08-05T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 2,
    name: 'The Oasis Ergonomic Lounge Chair',
    description: 'Sculpted to cradling perfection. Continuous curve lines eliminate joint stress while commanding quiet architectural luxury.',
    dimensions: '88 x 92 x 74 cm',
    height: '74.00',
    price: '34000.00',
    delivery_date: '2026-10-20',
    material: 'Hand-layered fiberglass core with internal structural ribbing',
    finish: 'Silky Eggshell Gelcoat',
    faq: [
      {
        question: 'What is the weight capacity of this chair?',
        answer: 'Engineered and stress-tested to comfortably support up to 220 kg.',
      },
    ],
    subcategory_ids: [4], // Lounge Chairs
    colors: [INITIAL_MOCK_COLORS[0], INITIAL_MOCK_COLORS[2]],
    color_ids: [1, 3],
    images: [INITIAL_MOCK_PRODUCT_IMAGES[2]],
    created_at: '2026-08-06T10:00:00Z',
    updated_at: '2026-08-06T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 3,
    name: 'The Monolith Oval Dining Table',
    description: 'Monumental 8-person dining table featuring soft rounded pillared bases and a seamless cantilevered top.',
    dimensions: '240 x 110 x 76 cm',
    height: '76.00',
    price: '68000.00',
    delivery_date: '2026-11-01',
    material: 'Dual-cavity reinforced structural composite',
    finish: 'Satin Architectural White',
    faq: [
      {
        question: 'Does it ship assembled or in sections?',
        answer: 'Delivered in three interlocking reinforced sections with white-glove assembly included across Cairo and North Coast.',
      },
    ],
    subcategory_ids: [2], // Dining Tables
    colors: [INITIAL_MOCK_COLORS[0], INITIAL_MOCK_COLORS[3], INITIAL_MOCK_COLORS[4]],
    color_ids: [1, 4, 5],
    images: [INITIAL_MOCK_PRODUCT_IMAGES[3]],
    created_at: '2026-08-07T10:00:00Z',
    updated_at: '2026-08-07T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 4,
    name: 'Artisanal Totem Vessel No. 04',
    description: 'Hand-sculpted monolithic pedestal vessel celebrating primitive geometry and mineral tactile finishes.',
    dimensions: '45 x 45 x 115 cm',
    height: '115.00',
    price: '16500.00',
    delivery_date: '2026-10-10',
    material: 'Fiberglass infused with crushed mineral stone aggregate',
    finish: 'Raw Travertine Texture',
    faq: [
      {
        question: 'Can this vessel hold water or live florals?',
        answer: 'Yes, fully waterproof interior lined with watertight seal.',
      },
    ],
    subcategory_ids: [6, 8], // Monolithic Pedestals & Artisanal Vessels
    colors: [INITIAL_MOCK_COLORS[1], INITIAL_MOCK_COLORS[3]],
    color_ids: [2, 4],
    images: [INITIAL_MOCK_PRODUCT_IMAGES[4]],
    created_at: '2026-08-08T10:00:00Z',
    updated_at: '2026-08-08T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 5,
    name: 'Aero Prototype Lounge (Archived)',
    description: 'Early experimental prototype from the 2025 Cairo Art & Architecture Biennale collection.',
    dimensions: '90 x 90 x 70 cm',
    height: '70.00',
    price: '22000.00',
    delivery_date: null,
    material: 'Experimental resin composite',
    finish: 'Raw Matte',
    faq: [],
    subcategory_ids: [4],
    colors: [INITIAL_MOCK_COLORS[0]],
    color_ids: [1],
    images: [INITIAL_MOCK_PRODUCT_IMAGES[5]],
    created_at: '2026-07-20T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z',
    deleted_at: '2026-09-01T12:00:00Z', // Soft-deleted for testing restore & hard-delete
  },
];

// ==========================================
// MOCK CARTS
// ==========================================
export interface MockCartRecord {
  id: number;
  user_id: number;
  items: BackendCartItem[];
  created_at: string;
  updated_at: string;
}

export const INITIAL_MOCK_CARTS: MockCartRecord[] = [
  {
    id: 1,
    user_id: 1, // Anas Sayed
    created_at: '2026-09-18T12:15:00Z',
    updated_at: '2026-09-18T12:15:00Z',
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: 'The Dune Low Coffee Table',
        product_price: '28500.00',
        product_image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85',
        color_id: 1,
        selected_color: {
          id: 1,
          name: 'Alabaster Bone',
          hex_code: '#EBE3D5',
        },
        quantity: 1,
        subtotal: '28500.00',
        created_at: '2026-09-18T12:15:00Z',
        updated_at: '2026-09-18T12:15:00Z',
      },
    ],
  },
  {
    id: 2,
    user_id: 2, // Karim Mansour
    created_at: '2026-09-15T09:40:00Z',
    updated_at: '2026-09-15T09:40:00Z',
    items: [],
  },
];

// ==========================================
// MOCK ORDERS
// ==========================================
import { BackendOrder } from '@/types/order';

export const INITIAL_MOCK_ORDERS: BackendOrder[] = [
  {
    id: 1,
    order_number: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    user_id: 1, // Anas Sayed (Customer)
    address_id: 1,
    shipping_address: {
      title: 'Zamalek Atelier Residence',
      country: 'Egypt',
      city: 'Cairo',
      street: '26th of July Street, Building 14',
      building_number: '14',
      apartment_number: '5B',
    },
    status: 'NOT_CONFIRMED',
    total_price: '28500.00',
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: 'The Dune Low Coffee Table',
        product_price: '28500.00',
        color_name: 'Alabaster Bone',
        color_hex_code: '#EBE3D5',
        quantity: 1,
        subtotal: '28500.00',
      },
    ],
    created_at: '2026-03-08T14:20:00Z',
    updated_at: '2026-03-08T14:20:00Z',
  },
  {
    id: 2,
    order_number: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    user_id: 2, // Karim Mansour
    address_id: 2,
    shipping_address: {
      title: 'Marassi Summer Villa',
      country: 'Egypt',
      city: 'North Coast',
      street: 'Sidi Abdel Rahman, Marina Bay Villa 42',
      building_number: '42',
      apartment_number: 'Ground',
    },
    status: 'CONFIRMED',
    total_price: '42000.00',
    items: [
      {
        id: 2,
        product_id: 2,
        product_name: 'Monolith Architectural Pedestal',
        product_price: '42000.00',
        color_name: 'Sirocco Sand',
        color_hex_code: '#D8CEBF',
        quantity: 1,
        subtotal: '42000.00',
      },
    ],
    created_at: '2026-03-01T10:15:00Z',
    updated_at: '2026-03-02T11:00:00Z',
  },
];

