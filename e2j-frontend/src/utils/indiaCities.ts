export const INDIA_STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Rajahmundry','Tirupati','Kakinada'],
  'Arunachal Pradesh': ['Itanagar','Naharlagun','Pasighat'],
  'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah'],
  'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon'],
  'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Anand','Junagadh'],
  'Haryana': ['Faridabad','Gurgaon','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat'],
  'Himachal Pradesh': ['Shimla','Mandi','Solan','Dharamshala','Baddi','Nahan'],
  'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh'],
  'Karnataka': ['Bangalore','Mysore','Hubli','Mangalore','Belgaum','Gulbarga','Davanagere','Bellary','Shimoga','Tumkur'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kannur'],
  'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Navi Mumbai'],
  'Manipur': ['Imphal','Thoubal','Bishnupur'],
  'Meghalaya': ['Shillong','Tura'],
  'Mizoram': ['Aizawl','Lunglei'],
  'Nagaland': ['Kohima','Dimapur'],
  'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Pathankot','Hoshiarpur'],
  'Rajasthan': ['Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bharatpur','Sikar'],
  'Sikkim': ['Gangtok','Namchi'],
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Tiruppur'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Ramagundam'],
  'Tripura': ['Agartala','Dharmanagar'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Meerut','Bareilly','Aligarh','Moradabad','Gorakhpur','Noida','Ghaziabad','Mathura','Firozabad'],
  'Uttarakhand': ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Nainital'],
  'West Bengal': ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman','Malda'],
  'Delhi': ['New Delhi','Delhi'],
  'Chandigarh': ['Chandigarh'],
  'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Baramulla'],
  'Ladakh': ['Leh','Kargil'],
  'Puducherry': ['Puducherry','Karaikal'],
};

export const INDIA_STATE_LIST = Object.keys(INDIA_STATE_CITIES).sort();

export function citiesForState(state: string): string[] {
  return INDIA_STATE_CITIES[state] ?? [];
}
