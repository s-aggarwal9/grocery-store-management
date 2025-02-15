# Grocery Store Management System

A comprehensive store management system designed to streamline inventory, invoicing, and customer tracking processes. Built with modern web technologies to provide a robust solution for small to medium-sized businesses.

## Features

- 📊 Dashboard with key metrics
- 📦 Product inventory management
- 👥 Customer management
- 📝 Invoice creation and management
- 💰 Financial tracking and reporting
- 🖨️ PDF invoice export with company branding

## Tech Stack

- Frontend: React with TypeScript
- Backend: Express.js
- Database: PostgreSQL with Drizzle ORM
- UI: Tailwind CSS + shadcn/ui
- State Management: TanStack Query

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd grocery-store-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
DATABASE_URL=your_postgresql_connection_string
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/client` - Frontend React application
- `/server` - Express.js backend
- `/shared` - Shared types and schemas
- `/public` - Static assets

## License

MIT
