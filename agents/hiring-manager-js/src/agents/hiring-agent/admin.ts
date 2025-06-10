import type { AgentContext } from "@agentuity/sdk";

type AdminRequest = {
	type: "admin";
	applicantName: string;
	applicantKey: string;
	adminKey: string;
	action: "register" | "unregister";
};

/**
 * Validates and processes an admin request.
 * Returns a success message if valid, or an error message if invalid.
 */
export async function validateAdminRequest(
	data: AdminRequest,
	ctx: AgentContext
): Promise<{ success: boolean; message: string }> {
	try {
		if (
			!data.applicantName ||
			typeof data.applicantName !== "string" ||
			!data.applicantKey ||
			typeof data.applicantKey !== "string" ||
			!data.adminKey ||
			typeof data.adminKey !== "string" ||
			!data.action ||
			(data.action !== "register" && data.action !== "unregister")
		) {
			return { success: false, message: "Invalid request format." };
		}

		if (data.adminKey !== process.env.ADMIN_KEY) {
			return { success: false, message: "Invalid admin key." };
		}

		if (data.action === "register") {
			try {
				await ctx.kv.set("applicants", data.applicantKey, data.applicantName);
				return { success: true, message: `Successfully registered ${data.applicantName}.` };
			} catch (error) {
				return { success: false, message: "Failed to register applicant." };
			}
		} else if (data.action === "unregister") {
			try {
				await ctx.kv.delete("applicants", data.applicantKey);
				return { success: true, message: `Successfully unregistered ${data.applicantName}.` };
			} catch (error) {
				return { success: false, message: "Failed to unregister applicant." };
			}
		}

		return { success: false, message: "Invalid action." };
	} catch (error) {
		return { success: false, message: "Failed to process admin request." };
	}
}

/**
 * Verifies if an applicant is registered and authorized.
 */
export async function verifyApplicant(
	applicantName: string,
	applicantKey: string,
	ctx: AgentContext
): Promise<boolean> {
	try {
		const result = await ctx.kv.get("applicants", applicantKey);
		if (!result.exists) return false;
		const storedName = await result.data.text();
		return storedName === applicantName;
	} catch (error) {
		return false;
	}
}
