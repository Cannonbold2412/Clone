import { z } from "zod";

export const INDIAN_STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

export const AddressInput = z.object({
  name: z.string().trim().min(2, "Please enter full name").max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10 digit mobile number"),
  email: z.string().trim().email("Please enter a valid email").max(100).optional().or(z.literal("")),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Please enter a valid 6 digit pincode"),
  line1: z.string().trim().min(3, "Please enter house / flat / building").max(120),
  line2: z.string().trim().min(3, "Please enter area / street / locality").max(120),
  landmark: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please enter city").max(60),
  state: z.enum(INDIAN_STATES as [string, ...string[]], { message: "Please select a state" }),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().optional(),
});
