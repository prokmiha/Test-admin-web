import requests
import sys
import json
from datetime import datetime

class AdminPanelAPITester:
    def __init__(self, base_url="https://service-mgmt-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {'categories': [], 'products': []}

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")
        if success:
            self.tests_passed += 1
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)
            
            return response
        except requests.RequestException as e:
            print(f"   Request error: {str(e)}")
            return None

    def test_api_root(self):
        """Test API root endpoint"""
        print("🔍 Testing API Root...")
        response = self.make_request('GET', '')
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if success:
            details += f", Message: {response.json().get('message', 'N/A')}"
        self.log_test("API Root", success, details)
        return success

    def test_analytics_api(self):
        """Test analytics endpoint"""
        print("📊 Testing Analytics API...")
        response = self.make_request('GET', 'analytics')
        success = response and response.status_code == 200
        
        details = f"Status: {response.status_code if response else 'No response'}"
        if success:
            data = response.json()
            required_fields = ['total_categories', 'active_categories', 'total_products', 
                             'active_products', 'products_by_scenario', 'price_stats']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                success = False
                details += f", Missing fields: {missing_fields}"
            else:
                details += f", Categories: {data['total_categories']}, Products: {data['total_products']}"
        
        self.log_test("Analytics API", success, details)
        return success

    def test_categories_crud(self):
        """Test categories CRUD operations"""
        print("📁 Testing Categories CRUD...")
        
        # Test GET categories
        response = self.make_request('GET', 'categories')
        get_success = response and response.status_code == 200
        initial_count = len(response.json()) if get_success else 0
        self.log_test("Get Categories", get_success, f"Status: {response.status_code if response else 'No response'}, Count: {initial_count}")

        # Test CREATE category
        test_category = {
            "name": "Test Category",
            "description": "Test category description",
            "status": "active"
        }
        response = self.make_request('POST', 'categories', test_category)
        create_success = response and response.status_code == 200
        category_id = None
        
        if create_success:
            category_data = response.json()
            category_id = category_data.get('id')
            self.created_items['categories'].append(category_id)
            details = f"Status: {response.status_code}, ID: {category_id}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        self.log_test("Create Category", create_success, details)

        # Test GET specific category
        if category_id:
            response = self.make_request('GET', f'categories/{category_id}')
            get_one_success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            if get_one_success:
                data = response.json()
                details += f", Name: {data.get('name')}"
            self.log_test("Get Category by ID", get_one_success, details)
        
        # Test UPDATE category
        if category_id:
            update_data = {"name": "Updated Test Category", "description": "Updated description"}
            response = self.make_request('PUT', f'categories/{category_id}', update_data)
            update_success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Update Category", update_success, details)

        return create_success

    def test_products_crud(self):
        """Test products CRUD operations"""
        print("📦 Testing Products CRUD...")
        
        # Test GET products
        response = self.make_request('GET', 'products')
        get_success = response and response.status_code == 200
        initial_count = len(response.json()) if get_success else 0
        self.log_test("Get Products", get_success, f"Status: {response.status_code if response else 'No response'}, Count: {initial_count}")

        # Test CREATE product
        test_product = {
            "name": "Test Product",
            "description": "Test product description",
            "scenario": "digital_product",
            "category_id": self.created_items['categories'][0] if self.created_items['categories'] else None,
            "price": 999.99,
            "status": "active"
        }
        response = self.make_request('POST', 'products', test_product)
        create_success = response and response.status_code == 200
        product_id = None
        
        if create_success:
            product_data = response.json()
            product_id = product_data.get('id')
            self.created_items['products'].append(product_id)
            details = f"Status: {response.status_code}, ID: {product_id}, Price: {product_data.get('price')}"
        else:
            details = f"Status: {response.status_code if response else 'No response'}"
        
        self.log_test("Create Product", create_success, details)

        # Test GET specific product
        if product_id:
            response = self.make_request('GET', f'products/{product_id}')
            get_one_success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            if get_one_success:
                data = response.json()
                details += f", Name: {data.get('name')}, Scenario: {data.get('scenario')}"
            self.log_test("Get Product by ID", get_one_success, details)

        # Test UPDATE product
        if product_id:
            update_data = {"name": "Updated Test Product", "price": 1299.99}
            response = self.make_request('PUT', f'products/{product_id}', update_data)
            update_success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Update Product", update_success, details)

        return create_success

    def test_products_filters(self):
        """Test product filtering"""
        print("🔍 Testing Product Filters...")
        
        filters = [
            ("status", "active"),
            ("scenario", "digital_product"),
            ("status", "inactive")
        ]
        
        all_success = True
        for filter_type, filter_value in filters:
            response = self.make_request('GET', 'products', params={filter_type: filter_value})
            success = response and response.status_code == 200
            count = len(response.json()) if success else 0
            details = f"Status: {response.status_code if response else 'No response'}, Count: {count}"
            self.log_test(f"Filter Products by {filter_type}={filter_value}", success, details)
            if not success:
                all_success = False
        
        return all_success

    def test_settings_api(self):
        """Test settings endpoints"""
        print("⚙️  Testing Settings API...")
        
        # Test language settings
        response = self.make_request('GET', 'settings/language')
        get_lang_success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if get_lang_success:
            data = response.json()
            details += f", Default: {data.get('default_language')}, Available: {len(data.get('available_languages', []))}"
        self.log_test("Get Language Settings", get_lang_success, details)

        # Test payment settings
        response = self.make_request('GET', 'settings/payment')
        get_payment_success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if get_payment_success:
            data = response.json()
            details += f", Currency: {data.get('currency')}, Methods: {len(data.get('payment_methods', []))}"
        self.log_test("Get Payment Settings", get_payment_success, details)

        # Test update language settings
        lang_update = {"default_language": "en", "available_languages": ["en", "ru", "uk"]}
        response = self.make_request('PUT', 'settings/language', lang_update)
        update_lang_success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        self.log_test("Update Language Settings", update_lang_success, details)

        return get_lang_success and get_payment_success

    def test_archive_api(self):
        """Test archive endpoints"""
        print("📥 Testing Archive API...")
        
        response = self.make_request('GET', 'archive')
        success = response and response.status_code == 200
        details = f"Status: {response.status_code if response else 'No response'}"
        if success:
            data = response.json()
            cat_count = len(data.get('categories', []))
            prod_count = len(data.get('products', []))
            details += f", Categories: {cat_count}, Products: {prod_count}"
        
        self.log_test("Get Archive", success, details)
        return success

    def test_delete_operations(self):
        """Test delete operations (archiving)"""
        print("🗑️  Testing Delete Operations...")
        
        # Delete created product
        if self.created_items['products']:
            product_id = self.created_items['products'][0]
            response = self.make_request('DELETE', f'products/{product_id}')
            success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            if success:
                details += f", Message: {response.json().get('message', 'N/A')}"
            self.log_test("Delete Product (Archive)", success, details)

        # Delete created category
        if self.created_items['categories']:
            category_id = self.created_items['categories'][0]
            response = self.make_request('DELETE', f'categories/{category_id}')
            success = response and response.status_code == 200
            details = f"Status: {response.status_code if response else 'No response'}"
            if success:
                details += f", Message: {response.json().get('message', 'N/A')}"
            self.log_test("Delete Category (Archive)", success, details)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Admin Panel API Tests")
        print("=" * 50)
        
        # Run tests in logical order
        self.test_api_root()
        self.test_analytics_api()
        self.test_categories_crud()
        self.test_products_crud()
        self.test_products_filters()
        self.test_settings_api()
        self.test_archive_api()
        self.test_delete_operations()
        
        # Print summary
        print("=" * 50)
        print("📋 TEST SUMMARY")
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AdminPanelAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())