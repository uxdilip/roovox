# Sniket - Device Repair Service Platform

A modern, full-stack service booking platform for device repairs built with Next.js 14, TypeScript, Appwrite, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Device Selection**: Support for phones and laptops with brand/model selection
- **Service Booking**: Complete booking flow with time slots and location options
- **User Authentication**: Secure authentication with Appwrite
- **Provider Management**: Provider profiles with ratings and specializations
- **Real-time Messaging**: Communication between customers and providers
- **Payment Integration**: Ready for Stripe integration
- **Admin Dashboard**: Comprehensive admin controls

### Technical Features
- **PWA Ready**: Progressive Web App capabilities
- **Responsive Design**: Mobile-first responsive design
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Built with shadcn/ui components
- **Performance Optimized**: Fast loading and smooth interactions

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Appwrite (BaaS)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **Authentication**: Appwrite Auth
- **Database**: Appwrite Database
- **File Storage**: Appwrite Storage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sniket-service-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables with your Appwrite configuration:
   - Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
   - Set up database collections as per the schema
   - Update the environment variables

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🗄 Database Schema

### Collections Structure

#### Users Collection
- User profiles with contact information
- Role-based access (customer/provider/admin)
- Address information with coordinates

#### Providers Collection
- Provider business information
- Specializations and service areas
- Working hours and ratings
- Verification status

#### Devices Collection
- Device categories (phone/laptop)
- Brand and model information
- Common issues and specifications

#### Services Collection
- Service offerings per device
- Pricing and part quality options
- Warranty information

#### Bookings Collection
- Complete booking lifecycle
- Payment and rating integration
- Location and scheduling details

#### Messages Collection
- Real-time communication
- File attachment support
- Read status tracking

#### Payments Collection
- Payment processing records
- Commission calculations
- Transaction history

## 🚀 API Endpoints

### Authentication
- `POST /api/auth` - Register/Login/Logout
- `GET /api/auth` - Get current user

### Devices
- `GET /api/devices` - List devices with filters
- `GET /api/devices/[id]` - Get device details

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - List user bookings
- `PATCH /api/bookings/[id]` - Update booking status

### Providers
- `GET /api/providers` - Search providers
- `POST /api/providers` - Register as provider

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting ready
- XSS protection

## 📱 PWA Features

- Offline capability
- Push notifications ready
- App-like experience
- Installation prompts
- Service worker integration

## 🎨 Design System

### Color Palette
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Neutral grays for text and backgrounds

### Typography
- Font: Inter (Google Fonts)
- Responsive text scaling
- Consistent spacing system

### Components
- Fully accessible UI components
- Consistent design patterns
- Hover states and animations
- Mobile-optimized interactions

## 🚀 Deployment

### Prerequisites
- Appwrite project setup
- Environment variables configured
- Database collections created

### Build
```bash
npm run build
```

### Deploy
The application is configured for static export and can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 🔄 Development Workflow

### Adding New Features
1. Create feature branch
2. Implement with TypeScript
3. Add proper error handling
4. Update documentation
5. Test thoroughly
6. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Consistent naming conventions
- Component organization
- Error boundary implementation

## 📊 Performance

### Optimization Features
- Image optimization
- Code splitting
- Tree shaking
- Bundle analysis
- Caching strategies

### Monitoring
- Performance metrics
- Error tracking ready
- User analytics ready
- SEO optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints
- Contact the development team

## 🚀 Future Enhancements

- Real-time location tracking
- Advanced payment features
- Multi-language support
- Enhanced analytics dashboard
- AI-powered diagnostics
- Integration with more payment providers