"use strict";
// Universal Supabase client for both server and client environments
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
var supabase_js_1 = require("@supabase/supabase-js");
function createClient(supabaseUrl, supabaseKey) {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
