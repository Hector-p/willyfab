"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, MessageCircle } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import type { Service } from "../data/services";

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name (at least 2 characters).").max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) => value === "" || PHONE_PATTERN.test(value), "Enter a valid phone number."),
  company: z.string().trim().max(160),
  service: z.string(),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(3000),
  website: z.string().max(200),
});

type InquiryValues = z.infer<typeof inquirySchema>;

type ApiValidationError = {
  detail?: Array<{ loc?: Array<string | number>; msg?: string }> | string;
};

const FIELD_NAMES: ReadonlyArray<keyof InquiryValues> = [
  "name",
  "email",
  "phone",
  "company",
  "service",
  "message",
  "website",
];

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const FALLBACK_MESSAGE =
  "We could not send your message right now. Please reach us on WhatsApp or email and we will respond directly.";

type InquiryFormProps = {
  apiBase: string;
  services: Service[];
  initialService?: string;
};

export function InquiryForm({ apiBase, services, initialService = "" }: InquiryFormProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      service: services.some((item) => item.slug === initialService) ? initialService : "",
      message: "",
      website: "",
    },
  });

  const serviceTitle = (slug: string) => services.find((item) => item.slug === slug)?.title ?? "";

  async function onSubmit(values: InquiryValues) {
    setStatus({ kind: "submitting" });

    if (!apiBase) {
      setStatus({ kind: "error", message: FALLBACK_MESSAGE });
      return;
    }

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      company: values.company || null,
      service_interest: serviceTitle(values.service) || null,
      message: values.message,
      website: values.website,
    };

    try {
      const response = await fetch(`${apiBase}/api/v1/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        form.reset();
        setStatus({ kind: "success" });
        return;
      }

      const body = (await response.json().catch(() => null)) as ApiValidationError | null;

      if (response.status === 422 && Array.isArray(body?.detail)) {
        let mapped = false;
        for (const item of body.detail) {
          const field = item.loc?.[1];
          if (typeof field === "string" && (FIELD_NAMES as readonly string[]).includes(field)) {
            form.setError(field as keyof InquiryValues, { message: item.msg ?? "Check this field." });
            mapped = true;
          }
        }
        setStatus({
          kind: "error",
          message: mapped ? "Please correct the highlighted fields and try again." : FALLBACK_MESSAGE,
        });
        return;
      }

      if (response.status === 429 && typeof body?.detail === "string") {
        setStatus({ kind: "error", message: body.detail });
        return;
      }

      setStatus({ kind: "error", message: FALLBACK_MESSAGE });
    } catch {
      setStatus({ kind: "error", message: FALLBACK_MESSAGE });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="inquiry-success" role="status">
        <span className="inquiry-success-mark">
          <Check aria-hidden="true" size={24} strokeWidth={2} />
        </span>
        <h3>Thank you. Your message is in.</h3>
        <p>
          Our team reviews every inquiry and will reply using the email or phone number you provided. For urgent
          matters, WhatsApp is the fastest route.
        </p>
        <button className="wf-text-link" onClick={() => setStatus({ kind: "idle" })} type="button">
          Send another inquiry <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <Form {...form}>
      <form className="inquiry-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="inquiry-grid">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name *</FormLabel>
                <FormControl>
                  <Input autoComplete="name" className="wf-field" placeholder="Adaeze Okafor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    className="wf-field"
                    inputMode="email"
                    placeholder="you@company.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone / WhatsApp</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="tel"
                    className="wf-field"
                    inputMode="tel"
                    placeholder="+234 800 000 0000"
                    type="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company / organisation</FormLabel>
                <FormControl>
                  <Input autoComplete="organization" className="wf-field" placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem className="span-2">
                <FormLabel>Service of interest</FormLabel>
                <FormControl>
                  <select className="wf-field" {...field}>
                    <option value="">Not sure yet / general enquiry</option>
                    {services.map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="span-2">
                <FormLabel>Project details *</FormLabel>
                <FormControl>
                  <Textarea
                    className="wf-field"
                    placeholder="Describe the equipment or service, the capacity you need, and the project location."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <div aria-hidden="true" className="wf-honeypot">
              <label>
                Leave this field empty
                <input autoComplete="off" tabIndex={-1} {...field} />
              </label>
            </div>
          )}
        />

        {status.kind === "error" ? (
          <p className="inquiry-status" role="alert">
            {status.message}
          </p>
        ) : null}

        <div className="inquiry-form-footer">
          <p>Fields marked * are required. We use your details only to respond to your enquiry.</p>
          <button className="wf-button wf-button-orange" disabled={submitting} type="submit">
            {submitting ? "Sending…" : "Send inquiry"}
            {!submitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
          </button>
        </div>

        <p className="contact-form-alt">
          <MessageCircle aria-hidden="true" size={15} /> Prefer chat? Message us on WhatsApp at +234 803 540 8843.
        </p>
      </form>
    </Form>
  );
}
