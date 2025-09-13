"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminClient = exports.createServiceClient = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
// Server-only client with service role key (for admin operations)
var createServiceClient = function () {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
exports.createServiceClient = createServiceClient;
// Admin operations that bypass RLS (instance for performing admin tasks)
exports.adminClient = (0, exports.createServiceClient)();
