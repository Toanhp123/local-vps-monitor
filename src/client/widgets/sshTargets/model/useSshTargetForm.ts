import { useState } from "react";
import type { FormEvent } from "react";
import type {
	SshTargetBootstrapInput,
	SshTargetCreateInput,
} from "@shared/types";

export type SshAuthMode = "password" | "key";

interface SshTargetFormValues {
	authMode: SshAuthMode;
	host: string;
	name: string;
	password: string;
	port: string;
	privateKeyPath: string;
	username: string;
}

interface UseSshTargetFormInput {
	onAddTarget: (input: SshTargetCreateInput) => Promise<boolean>;
	onBootstrapTarget: (input: SshTargetBootstrapInput) => Promise<boolean>;
}

const defaultForm: SshTargetFormValues = {
	name: "",
	host: "",
	port: "22",
	username: "",
	authMode: "key",
	password: "",
	privateKeyPath: "",
};

export function useSshTargetForm({
	onAddTarget,
	onBootstrapTarget,
}: UseSshTargetFormInput) {
	const [form, setForm] = useState(defaultForm);
	const credentialLabel =
		form.authMode === "password" ? "Setup password" : "Private key path";
	const credentialHelp =
		form.authMode === "password"
			? "Used only for this setup request, then discarded. Not stored."
			: "Use the private key file, not the .pub file.";
	const credentialPlaceholder =
		form.authMode === "password" ? "SSH password" : "~/.ssh/vps_monitor";

	const updateField = <Field extends keyof SshTargetFormValues>(
		field: Field,
		value: SshTargetFormValues[Field],
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const baseInput = {
			name: form.name,
			host: form.host,
			port: Number(form.port),
			username: form.username,
			enabled: true,
		};
		const added =
			form.authMode === "password"
				? await onBootstrapTarget({
						...baseInput,
						password: form.password,
					})
				: await onAddTarget({
						...baseInput,
						privateKeyPath: form.privateKeyPath,
					});

		if (added) {
			setForm(defaultForm);
		}
	};

	return {
		credentialHelp,
		credentialLabel,
		credentialPlaceholder,
		form,
		handleSubmit,
		updateField,
	};
}
