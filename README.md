# DUDSZ.lk - T-Shirt E-Commerce Platform

A modern, full-stack e-commerce platform built with Next.js 14, TypeScript, and PostgreSQL. Features dynamic theming, bulk product management, and complex bundle offer logic.

## Features

### Admin Panel
- **Dashboard**: Real-time statistics for products and orders
- **Dynamic Theme Editor**: Change site colors instantly from the database
- **Bulk Product Upload**: Upload multiple images and auto-create product drafts
- **Product Management**: Full CRUD operations for products
- **Offer/Bundle Management**: Create complex bundle deals (e.g., "Buy 4 for Rs. 2000")
- **Order Workflow**: Manage orders through Pending → Ongoing → Delivered states
- **Shipping Configuration**: Configure base shipping rates and discounts

### Customer Experience
- **Dynamic Theming**: Site colors loaded from database, reflecting admin changes instantly
- **Featured Offers**: Display up to 3 featured bundle offers on homepage
- **Product Catalog**: Browse all enabled products
- **Smart Cart**: Complex bundle validation with visual alerts
- **Social Sharing**: Share offers on Facebook and WhatsApp

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand (for cart logic)
- **UI Components**: Shadcn/UI (Radix UI)
- **File Storage**: AWS S3 compatible (with local fallback)
- **DevOps**: Docker & Docker Compose

## Project Structure

```
dudsz-lk/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── src/
│   ├── app/
│   │   ├── admin/            # Admin dashboard routes
│   │   │   ├── login/
│   │   │   ├── products/
│   │   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   └── upload/
│   │   ├── layout.tsx        # Root layout with theme provider
│   │   └── page.tsx          # Customer homepage
│   ├── components/
│   │   ├── admin/            # Admin components
│   │   ├── customer/         # Customer components
│   │   ├── providers/        # Context providers
│   │   └── ui/               # Shadcn UI components
│   ├── lib/
│   │   ├── actions/          # Server actions
│   │   ├── auth.ts           # Auth configuration
│   │   ├── db.ts             # Prisma client
│   │   ├── storage.ts        # S3 storage utilities
│   │   └── utils.ts          # Helper functions
│   ├── store/
│   │   └── cart-store.ts     # Zustand cart store
│   └── types/                # TypeScript types
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker services configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running locally without Docker)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd dudsz-lk
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- AWS S3 credentials (optional)

4. **Set up the database**
```bash
# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

This will create:
- Default admin user: `admin@dudsz.lk` / `admin123`
- Sample products and categories
- Sri Lankan cities with shipping costs
- Default site configuration

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

1. **Build and start services**
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL container
- Build Next.js application
- Run database migrations
- Seed initial data
- Start the application on port 3000

2. **Access the application**
- Customer site: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login

3. **Stop services**
```bash
docker-compose down
```

4. **View logs**
```bash
docker-compose logs -f app
```

## Default Admin Credentials

After seeding the database:
- **Email**: admin@dudsz.lk
- **Password**: admin123

**Important**: Change these credentials in production!

## Key Features Explained

### 1. Dynamic Theming

The site's colors are stored in the database (`SiteConfig` table) and loaded on every page render. Admins can update colors from **Admin > Settings > Theme & Branding**, and changes reflect instantly across the entire site.

**Implementation**:
- `ThemeProvider` component injects CSS variables
- Colors fetched via server action in root layout
- Uses CSS `var(--primary)`, `var(--secondary)`, etc.

### 2. Bulk Product Upload

Upload multiple images at once, and the system auto-creates product drafts:
1. Each image becomes one product
2. Default values: 200g weight, Rs. 800 price
3. Products created as disabled drafts
4. Edit details in Products page before enabling

**Location**: Admin > Bulk Upload

### 3. Complex Bundle Cart Logic

The cart supports bundle offers with validation:
- Items grouped by bundle
- Visual alerts for incomplete bundles
- "Add More" button redirects to offer page
- Automatic price calculation when bundle is complete

**Implementation**: Zustand store with bundle grouping logic

### 4. Order Workflow

1. **Pending**: New order placed
2. **Ongoing**: Admin uploads packing photo
3. **Delivered**: Order completed

**Location**: Admin > Orders

## Database Schema

### Key Models

- **User**: Authentication and roles (CUSTOMER, ADMIN, SUPER_ADMIN)
- **Product**: Products with code, images, weight, stock
- **Category**: Long/Short sleeve classification
- **Offer**: Bundle offers with quantity and price logic
- **Order**: Customer orders with status workflow
- **SiteConfig**: Global settings including theme colors
- **City**: Sri Lankan cities with shipping costs

See `prisma/schema.prisma` for full schema.

## Configuration

### Theme Colors

Edit from Admin > Settings > Theme & Branding:
- Primary Color: Main brand color
- Secondary Color: Dark backgrounds
- Accent Color: Highlights
- Button Color: CTA buttons
- Text Color: Default text

### Shipping

Edit from Admin > Settings > Shipping:
- Base Rate: Cost per kilogram
- Discount: Global discount toggle and percentage

## Development

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name <migration-name>

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npm run prisma:studio
```

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NEXTAUTH_URL` | Application URL | http://localhost:3000 |
| `NEXTAUTH_SECRET` | Random secret for auth | - |
| `AWS_REGION` | S3 region | us-east-1 |
| `AWS_ACCESS_KEY_ID` | S3 access key | - |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | - |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | dudsz-uploads |
| `AWS_S3_ENDPOINT` | S3 endpoint (for MinIO, etc.) | - |

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### Docker issues
- Ensure Docker daemon is running
- Check logs: `docker-compose logs -f`
- Rebuild: `docker-compose build --no-cache`

### Theme not updating
- Clear browser cache
- Check SiteConfig in database
- Restart development server

## Production Deployment

1. Set strong `NEXTAUTH_SECRET`
2. Use production database
3. Configure S3 for file uploads
4. Set up SSL/TLS
5. Use environment-specific `.env` files
6. Enable database backups

## License

All rights reserved © 2024 DUDSZ.lk

## Support

For issues or questions, please create an issue in the repository.
