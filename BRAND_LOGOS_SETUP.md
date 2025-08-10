# Brand Logos Setup Guide

## Overview
This guide explains how to set up brand logos for the device selection interface. The system now loads brand logos directly from the frontend assets instead of storing image URLs in the database.

## What Was Updated

### 1. API Changes
- Removed `image_url` field from the phone data population API
- Updated to use `series_id` and `series_name` instead of `series`

### 2. Frontend Changes
- Added `getBrandLogo()` function in `DeviceSelector.tsx`
- Updated brand logo display to use local assets
- Added fallback to placeholder image if logo not found

### 3. File Structure
```
public/
  assets/
    brand-logos/          # Brand logo images go here
      Apple.png
      Samsung.png
      MI.png
      OnePlus.png
      Vivo.png
      Oppo.png
      Realme.png
      Nothing.png
      google.png
      motorola.png
      poco.jpg
      Honor.png
      Nokia.png
      Asus.png
    brand-placeholder.svg  # Fallback placeholder image
```

## Setup Instructions

### Option 1: Use the Copy Script
1. Place your brand logo images in the same directory as the project
2. Run the copy script:
   ```bash
   ./copy-brand-logos.sh
   ```
3. Edit the script to uncomment and adjust the copy commands for your image locations

### Option 2: Manual Copy
1. Create the directory: `mkdir -p public/assets/brand-logos`
2. Copy your brand logo images to `public/assets/brand-logos/`
3. Ensure the filenames match exactly (case-sensitive)

### Required Brand Logos
- **Apple.png** - Apple logo
- **Samsung.png** - Samsung logo  
- **MI.png** - Xiaomi/MI logo
- **OnePlus.png** - OnePlus logo
- **Vivo.png** - Vivo logo
- **Oppo.png** - Oppo logo
- **Realme.png** - Realme logo
- **Nothing.png** - Nothing logo
- **google.png** - Google logo
- **motorola.png** - Motorola logo
- **poco.jpg** - Poco logo
- **Honor.png** - Honor logo
- **Nokia.png** - Nokia logo
- **Asus.png** - Asus logo

## How It Works

### Brand Logo Loading
1. When a user selects a device category (phone/laptop), the system fetches available brands from the database
2. For each brand, the `getBrandLogo()` function maps the brand name to its corresponding image file
3. Images are loaded from `/assets/brand-logos/[filename]`
4. If an image fails to load, it falls back to the placeholder SVG

### Error Handling
- If a brand logo image is missing, the system shows a placeholder
- The placeholder is a simple SVG with "Brand" text
- No console errors are thrown for missing images

## Testing

### 1. Test Brand Display
1. Navigate to `/book` page
2. Select "Mobile Phones" category
3. Verify that brand logos are displayed correctly
4. Check that missing logos show the placeholder

### 2. Test API Population
1. Use the `/test-populate-phones` page
2. Run the "Populate Phones" function
3. Verify that new brands and models are added to the database
4. Check that the brands appear in the device selector

## Troubleshooting

### Images Not Loading
- Check that images are in the correct directory: `public/assets/brand-logos/`
- Verify filenames match exactly (case-sensitive)
- Check browser console for any 404 errors
- Ensure images are valid PNG/JPG/SVG files

### Missing Brands
- Run the populate API to add missing brands
- Check that the brand names in the database match the mapping in `getBrandLogo()`
- Verify the API response shows successful creation

### Performance Issues
- Optimize image sizes (recommended: 80x48px or similar aspect ratio)
- Use appropriate image formats (PNG for logos, JPG for photos)
- Consider using WebP format for better compression

## Next Steps

1. **Add Your Brand Images**: Copy your brand logo files to the `public/assets/brand-logos/` directory
2. **Test the Interface**: Navigate to `/book` and verify logos display correctly
3. **Populate Database**: Use the API to add missing brands and models
4. **Customize Placeholder**: Replace the default placeholder with your own design if desired

## Benefits of This Approach

- **No Database Storage**: Image URLs are not stored in the database
- **Easy Updates**: Simply replace image files to update logos
- **Better Performance**: Images are served as static assets
- **Version Control**: Logo changes can be tracked in git
- **CDN Ready**: Images can be easily served from a CDN 