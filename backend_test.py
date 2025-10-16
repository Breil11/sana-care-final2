import requests
import sys
import json
from datetime import datetime, timedelta

class SanaCareAPITester:
    def __init__(self, base_url="https://medstaff-hub-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.test_user_id = None
        self.admin_user_id = None
        self.test_user_email = None
        self.admin_user_email = None
        self.institution_id = None
        self.schedule_id = None
        self.shift_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        elif self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0
        except json.JSONDecodeError:
            return False, {"error": "Invalid JSON response"}, response.status_code

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Test regular user registration
        user_data = {
            "email": f"test_nurse_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "first_name": "Marie",
            "last_name": "Dupont",
            "role": "infirmier",
            "phone": "0123456789"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', user_data, expected_status=200)
        if success:
            self.test_user_id = response.get('id')
            self.log_test("User Registration", True)
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")

        # Test admin registration
        admin_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!",
            "first_name": "Admin",
            "last_name": "Test",
            "role": "admin",
            "phone": "0987654321"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', admin_data, expected_status=200)
        if success:
            self.admin_user_id = response.get('id')
            self.log_test("Admin Registration", True)
        else:
            self.log_test("Admin Registration", False, f"Status: {status}, Response: {response}")

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        # First approve the regular user (using admin if available)
        if self.admin_user_id:
            # Login as admin first
            admin_login_data = {
                "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "AdminPass123!"
            }
            success, response, status = self.make_request('POST', 'auth/login', admin_login_data, expected_status=200)
            if success:
                self.admin_token = response.get('access_token')
                self.log_test("Admin Login", True)
                
                # Approve the regular user
                if self.test_user_id:
                    success, _, status = self.make_request('PATCH', f'users/{self.test_user_id}/status?status=approved', 
                                                        None, token=self.admin_token, expected_status=200)
                    self.log_test("User Approval", success, f"Status: {status}" if not success else "")
            else:
                self.log_test("Admin Login", False, f"Status: {status}, Response: {response}")

        # Test regular user login
        user_login_data = {
            "email": f"test_nurse_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        
        success, response, status = self.make_request('POST', 'auth/login', user_login_data, expected_status=200)
        if success:
            self.token = response.get('access_token')
            self.log_test("User Login", True)
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n🔍 Testing Dashboard Stats...")
        
        success, response, status = self.make_request('GET', 'dashboard/stats', expected_status=200)
        if success and isinstance(response, dict):
            self.log_test("Dashboard Stats", True)
        else:
            self.log_test("Dashboard Stats", False, f"Status: {status}, Response: {response}")

    def test_institutions(self):
        """Test institution management"""
        print("\n🔍 Testing Institution Management...")
        
        # Test creating institution (admin only)
        if self.admin_token:
            institution_data = {
                "name": "Hôpital Test",
                "address": "123 Rue de la Santé, Paris",
                "phone": "0145678901",
                "email": "contact@hopital-test.fr"
            }
            
            success, response, status = self.make_request('POST', 'institutions', institution_data, 
                                                        token=self.admin_token, expected_status=200)
            if success:
                self.institution_id = response.get('id')
                self.log_test("Institution Creation", True)
            else:
                self.log_test("Institution Creation", False, f"Status: {status}, Response: {response}")

        # Test getting institutions
        success, response, status = self.make_request('GET', 'institutions', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Institutions", True)
        else:
            self.log_test("Get Institutions", False, f"Status: {status}, Response: {response}")

    def test_schedules(self):
        """Test schedule management"""
        print("\n🔍 Testing Schedule Management...")
        
        if not self.institution_id or not self.test_user_id:
            self.log_test("Schedule Creation", False, "Missing institution_id or user_id")
            return

        # Test creating schedule
        schedule_data = {
            "user_id": self.test_user_id,
            "institution_id": self.institution_id,
            "date": "2025-01-15",
            "start_time": "08:00",
            "end_time": "16:00",
            "status": "available"
        }
        
        success, response, status = self.make_request('POST', 'schedules', schedule_data, expected_status=200)
        if success:
            self.schedule_id = response.get('id')
            self.log_test("Schedule Creation", True)
        else:
            self.log_test("Schedule Creation", False, f"Status: {status}, Response: {response}")

        # Test getting schedules
        success, response, status = self.make_request('GET', 'schedules', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Schedules", True)
        else:
            self.log_test("Get Schedules", False, f"Status: {status}, Response: {response}")

    def test_shifts(self):
        """Test shift management"""
        print("\n🔍 Testing Shift Management...")
        
        if not self.institution_id or not self.test_user_id:
            self.log_test("Shift Creation", False, "Missing institution_id or user_id")
            return

        # Test creating shift
        shift_data = {
            "user_id": self.test_user_id,
            "institution_id": self.institution_id,
            "date": "2025-01-15",
            "hours": 8.0,
            "hourly_rate": 25.0,
            "travel_cost": 10.0
        }
        
        success, response, status = self.make_request('POST', 'shifts', shift_data, expected_status=200)
        if success:
            self.shift_id = response.get('id')
            self.log_test("Shift Creation", True)
        else:
            self.log_test("Shift Creation", False, f"Status: {status}, Response: {response}")

        # Test getting shifts
        success, response, status = self.make_request('GET', 'shifts', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Shifts", True)
        else:
            self.log_test("Get Shifts", False, f"Status: {status}, Response: {response}")

    def test_messages(self):
        """Test messaging system"""
        print("\n🔍 Testing Messaging System...")
        
        if not self.admin_user_id:
            self.log_test("Send Message", False, "Missing admin_user_id")
            return

        # Test sending message
        message_data = {
            "recipient_id": self.admin_user_id,
            "content": "Test message from API test"
        }
        
        success, response, status = self.make_request('POST', 'messages', message_data, expected_status=200)
        if success:
            self.log_test("Send Message", True)
        else:
            self.log_test("Send Message", False, f"Status: {status}, Response: {response}")

        # Test getting messages
        success, response, status = self.make_request('GET', 'messages', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Messages", True)
        else:
            self.log_test("Get Messages", False, f"Status: {status}, Response: {response}")

    def test_notifications(self):
        """Test notification system"""
        print("\n🔍 Testing Notification System...")
        
        success, response, status = self.make_request('GET', 'notifications', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Notifications", True)
        else:
            self.log_test("Get Notifications", False, f"Status: {status}, Response: {response}")

    def test_payslips(self):
        """Test payslip generation"""
        print("\n🔍 Testing Payslip System...")
        
        # Test getting payslips
        success, response, status = self.make_request('GET', 'payslips', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Payslips", True)
        else:
            self.log_test("Get Payslips", False, f"Status: {status}, Response: {response}")

    def test_exchanges(self):
        """Test shift exchange system"""
        print("\n🔍 Testing Shift Exchange System...")
        
        # Test getting exchanges
        success, response, status = self.make_request('GET', 'exchanges', expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Get Exchanges", True)
        else:
            self.log_test("Get Exchanges", False, f"Status: {status}, Response: {response}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Sana-Care API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test sequence
        self.test_user_registration()
        self.test_user_login()
        self.test_dashboard_stats()
        self.test_institutions()
        self.test_schedules()
        self.test_shifts()
        self.test_messages()
        self.test_notifications()
        self.test_payslips()
        self.test_exchanges()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SanaCareAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())