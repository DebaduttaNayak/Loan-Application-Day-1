import { Router } from "express";

const router = Router();

// Indian cities/states dataset for autocomplete simulation
const addressData = [
  { city: "Mumbai", state: "Maharashtra", district: "Mumbai City", pincodes: ["400001","400002","400003","400051","400070"] },
  { city: "Delhi", state: "Delhi", district: "Central Delhi", pincodes: ["110001","110002","110003","110011","110051"] },
  { city: "Bangalore", state: "Karnataka", district: "Bengaluru Urban", pincodes: ["560001","560002","560010","560040","560078"] },
  { city: "Hyderabad", state: "Telangana", district: "Hyderabad", pincodes: ["500001","500002","500003","500032","500081"] },
  { city: "Chennai", state: "Tamil Nadu", district: "Chennai", pincodes: ["600001","600002","600010","600040","600078"] },
  { city: "Kolkata", state: "West Bengal", district: "Kolkata", pincodes: ["700001","700002","700010","700019","700091"] },
  { city: "Pune", state: "Maharashtra", district: "Pune", pincodes: ["411001","411002","411010","411014","411028"] },
  { city: "Ahmedabad", state: "Gujarat", district: "Ahmedabad", pincodes: ["380001","380002","380004","380007","380015"] },
  { city: "Jaipur", state: "Rajasthan", district: "Jaipur", pincodes: ["302001","302002","302003","302004","302012"] },
  { city: "Surat", state: "Gujarat", district: "Surat", pincodes: ["395001","395002","395003","395004","395005"] },
  { city: "Lucknow", state: "Uttar Pradesh", district: "Lucknow", pincodes: ["226001","226002","226003","226004","226010"] },
  { city: "Kanpur", state: "Uttar Pradesh", district: "Kanpur Nagar", pincodes: ["208001","208002","208003","208004","208005"] },
  { city: "Nagpur", state: "Maharashtra", district: "Nagpur", pincodes: ["440001","440002","440003","440010","440012"] },
  { city: "Indore", state: "Madhya Pradesh", district: "Indore", pincodes: ["452001","452002","452003","452005","452010"] },
  { city: "Bhopal", state: "Madhya Pradesh", district: "Bhopal", pincodes: ["462001","462002","462003","462010","462016"] },
  { city: "Visakhapatnam", state: "Andhra Pradesh", district: "Visakhapatnam", pincodes: ["530001","530002","530003","530004","530022"] },
  { city: "Patna", state: "Bihar", district: "Patna", pincodes: ["800001","800002","800003","800004","800005"] },
  { city: "Vadodara", state: "Gujarat", district: "Vadodara", pincodes: ["390001","390002","390003","390007","390011"] },
  { city: "Ghaziabad", state: "Uttar Pradesh", district: "Ghaziabad", pincodes: ["201001","201002","201003","201010","201012"] },
  { city: "Ludhiana", state: "Punjab", district: "Ludhiana", pincodes: ["141001","141002","141003","141004","141008"] },
  { city: "Coimbatore", state: "Tamil Nadu", district: "Coimbatore", pincodes: ["641001","641002","641003","641004","641005"] },
  { city: "Kochi", state: "Kerala", district: "Ernakulam", pincodes: ["682001","682002","682003","682004","682005"] },
  { city: "Chandigarh", state: "Chandigarh", district: "Chandigarh", pincodes: ["160001","160002","160003","160011","160014"] },
  { city: "Guwahati", state: "Assam", district: "Kamrup", pincodes: ["781001","781002","781003","781005","781006"] },
];

const localities = [
  "Sector 1", "Sector 5", "Sector 10", "Sector 15", "Sector 20",
  "Green Park", "Defence Colony", "Koramangala", "Indiranagar", "Andheri West",
  "Bandra", "Powai", "HSR Layout", "JP Nagar", "Whitefield",
  "Gachibowli", "Jubilee Hills", "Anna Nagar", "T Nagar", "Adyar",
  "Salt Lake", "New Town", "Kankurgachi", "Kothrud", "Wakad",
  "Makarba", "Satellite", "Navrangpura", "Vastrapur", "Bodakdev",
  "Malviya Nagar", "Vaishali Nagar", "Civil Lines", "Adarsh Nagar",
];

// GET /api/address/autocomplete
router.get("/autocomplete", (req, res) => {
  const query = String(req.query.query ?? "").trim().toLowerCase();
  const pincode = String(req.query.pincode ?? "").trim();

  if (!query && !pincode) {
    return res.json([]);
  }

  const suggestions: Array<{
    label: string;
    city: string;
    state: string;
    pincode: string;
    district: string | null;
  }> = [];

  for (const entry of addressData) {
    const cityMatch = entry.city.toLowerCase().includes(query);
    const stateMatch = entry.state.toLowerCase().includes(query);
    const pincodeMatch = pincode
      ? entry.pincodes.some(p => p.startsWith(pincode))
      : false;

    if (cityMatch || stateMatch || pincodeMatch) {
      const localSubset = localities
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      for (const locality of localSubset) {
        const pc = entry.pincodes[Math.floor(Math.random() * entry.pincodes.length)];
        suggestions.push({
          label: `${locality}, ${entry.city}, ${entry.state} - ${pc}`,
          city: entry.city,
          state: entry.state,
          pincode: pc,
          district: entry.district,
        });
      }

      if (suggestions.length >= 8) break;
    }
  }

  return res.json(suggestions.slice(0, 8));
});

export default router;
