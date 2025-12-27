# Vendor Access Control Implementation

This document explains the access control system for vendors and products.

## Access Rules

### Regular Users
- ✅ Can **create** their own vendor shop (one per user)
- ✅ Can **view** only their own vendor
- ✅ Can **edit** only their own vendor
- ✅ Can **delete** only their own vendor
- ✅ Can **create** products for their own vendor
- ✅ Can **view** only their own products
- ✅ Can **edit** only their own products
- ✅ Can **delete** only their own products
- ❌ **Cannot** see all vendors list
- ❌ **Cannot** edit other users' vendors
- ❌ **Cannot** see other users' products

### Admin Users (Staff/Superuser)
- ✅ Can **view** all vendors
- ✅ Can **edit** any vendor
- ✅ Can **delete** any vendor
- ✅ Can **view** all products
- ✅ Can **edit** any product
- ✅ Can **delete** any product
- ✅ Can see vendor list with all products

## Backend Implementation

### Vendor Views (`Backend/vendors/views.py`)

#### `VendorListCreateView`
- **GET**: Returns all vendors for admins, only user's vendor for regular users
- **POST**: Users can only create their own vendor (one per user)

#### `VendorDetailView`
- **GET**: Admins can access any vendor, regular users only their own
- **PUT/PATCH**: Admins can update any vendor, regular users only their own
- **DELETE**: Admins can delete any vendor, regular users only their own

#### `ProductListCreateView`
- **GET**: Admins see all products, regular users see only their own
- **POST**: Users can only create products for their own vendor

#### `ProductDetailView`
- **GET**: Admins can access any product, regular users only their own
- **PUT/PATCH**: Admins can update any product, regular users only their own
- **DELETE**: Admins can delete any product, regular users only their own

## Frontend Implementation

### Vendor Pages

#### `/vendors` (Vendor List)
- **Admin Only**: Shows all vendors with their products
- **Regular Users**: Redirected to `/vendors/profile`

#### `/vendors/profile` (Vendor Profile)
- **Regular Users**: Manage their own vendor shop
- **Admins**: Can also access this to manage their own vendor (if they have one)

#### `/vendors/new` (Create Vendor)
- **All Users**: Can create their own vendor shop
- **Validation**: Backend prevents creating multiple vendors per user

#### `/vendors/[id]` (Edit Vendor)
- **Regular Users**: Can only edit their own vendor (backend enforces)
- **Admins**: Can edit any vendor

### Product Pages

#### `/vendors/products` (Product List)
- **Regular Users**: See only their own products
- **Admins**: See all products from all vendors

#### `/vendors/products/new` (Create Product)
- **Regular Users**: Can create products for their own vendor
- **Admins**: Can create products for any vendor (if needed)

#### `/vendors/products/[id]` (Edit Product)
- **Regular Users**: Can only edit their own products
- **Admins**: Can edit any product

## API Endpoints

### Vendors
- `GET /api/vendors/vendors/` - List vendors (filtered by user role)
- `POST /api/vendors/vendors/` - Create vendor (own only)
- `GET /api/vendors/vendors/<id>/` - Get vendor (filtered by user role)
- `PUT /api/vendors/vendors/<id>/` - Update vendor (own only for regular users)
- `DELETE /api/vendors/vendors/<id>/` - Delete vendor (own only for regular users)

### Products
- `GET /api/vendors/products/` - List products (filtered by user role)
- `POST /api/vendors/products/` - Create product (own vendor only)
- `GET /api/vendors/products/<id>/` - Get product (filtered by user role)
- `PUT /api/vendors/products/<id>/` - Update product (own only for regular users)
- `DELETE /api/vendors/products/<id>/` - Delete product (own only for regular users)

## Security Notes

1. **Backend is the source of truth** - Frontend checks are for UX only
2. **All permission checks happen on the backend** - Frontend cannot bypass
3. **Querysets are filtered** - Users only see what they're allowed to see
4. **Permission exceptions** - Proper error handling for unauthorized access

## Testing

### Test Regular User Access
1. Login as regular user
2. Try to access `/vendors` - should redirect to `/vendors/profile`
3. Try to edit another user's vendor - should get 403 error
4. Try to create products - should work for own vendor only

### Test Admin Access
1. Login as admin
2. Access `/vendors` - should see all vendors
3. Can edit any vendor
4. Can see all products from all vendors

