#!/bin/bash

# Charlie's HRMS - Quick Setup Script
# This script helps new developers set up their environment quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}$(echo $1 | sed 's/./=/g')${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 18
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Setup backend environment
setup_backend() {
    print_header "🔧 Setting up Backend Environment"
    
    cd backend
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created backend/.env from .env.example"
            print_warning "Please edit backend/.env with your actual values"
        else
            print_error "backend/.env.example not found"
            exit 1
        fi
    else
        print_info "backend/.env already exists"
    fi
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
    
    cd ..
}

# Setup frontend environment
setup_frontend() {
    print_header "🎨 Setting up Frontend Environment"
    
    cd frontend
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created frontend/.env.local from .env.example"
            print_warning "Please edit frontend/.env.local with your actual values"
        else
            print_error "frontend/.env.example not found"
            exit 1
        fi
    else
        print_info "frontend/.env.local already exists"
    fi
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
    
    cd ..
}

# Install root dependencies
setup_root() {
    print_header "📦 Setting up Root Dependencies"
    
    print_info "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
}

# Validate environment
validate_environment() {
    print_header "🔍 Validating Environment"
    
    if [ -f "validate-environment.js" ]; then
        node validate-environment.js
    else
        print_warning "Environment validation script not found"
    fi
}

# Generate secrets helper
generate_secrets() {
    print_header "🔑 Secret Generation Helper"
    
    echo -e "${CYAN}Here are some generated secrets for your .env files:${NC}"
    echo ""
    
    # Generate JWT secret
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo -e "${GREEN}JWT_SECRET=${JWT_SECRET}${NC}"
    else
        echo -e "${YELLOW}Install OpenSSL to generate JWT_SECRET automatically${NC}"
        echo -e "${YELLOW}Or use: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Remember to:${NC}"
    echo -e "${YELLOW}1. Get your Supabase credentials from https://supabase.com/dashboard${NC}"
    echo -e "${YELLOW}2. Update DATABASE_URL with your Supabase connection string${NC}"
    echo -e "${YELLOW}3. Set CORS_ORIGIN to your frontend URL${NC}"
    echo -e "${YELLOW}4. Set VITE_API_BASE_URL to your backend URL${NC}"
}

# Main setup function
main() {
    print_header "🚀 Charlie's HRMS - Quick Setup"
    
    # Check prerequisites
    check_node
    check_npm
    
    # Setup environments
    setup_root
    setup_backend
    setup_frontend
    
    # Generate helpful secrets
    generate_secrets
    
    # Validate setup
    validate_environment
    
    print_header "🎉 Setup Complete!"
    
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "${CYAN}1. Edit backend/.env with your actual values${NC}"
    echo -e "${CYAN}2. Edit frontend/.env.local with your actual values${NC}"
    echo -e "${CYAN}3. Run 'npm run validate-env' to check your setup${NC}"
    echo -e "${CYAN}4. Run 'npm run dev' to start both backend and frontend${NC}"
    echo ""
    echo -e "${BLUE}For detailed setup instructions, see: ENVIRONMENT_SETUP_GUIDE.md${NC}"
}

# Run main function
main