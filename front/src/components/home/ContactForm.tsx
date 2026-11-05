import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { ApiError, BUDGETS, CONTACT_METHODS, sendMessage, type ContactMethod, type MessagePayload } from '@/lib/api'
import { cn } from '@/lib/cn'
import { STRINGS, useLang } from '@/lib/i18n'
import { useContactPrefill } from '@/lib/contact'

type Status = 'idle' | 'sending' | 'sent'
type Field = keyof MessagePayload

const EMPTY: MessagePayload = {
  name: '',
  project_type: '',
  contact_method: 'telegram',
  email: '',
  phone: '',
  budget: '',
  message: '',
}

/** The single contact input shown for each method (its label comes from `t.form[method]`). */
const CONTACT_FIELDS: Record<
  ContactMethod,
  { field: 'email' | 'phone'; type: string; autoComplete: string; placeholder: string }
> = {
  telegram: { field: 'phone', type: 'text', autoComplete: 'off', placeholder: '@username' },
  phone: { field: 'phone', type: 'tel', autoComplete: 'tel', placeholder: '+380' },
  email: { field: 'email', type: 'email', autoComplete: 'email', placeholder: 'you@company.com' },
}

const INPUT_CLASSES =
  'w-full border-0 border-b border-foreground/25 bg-transparent px-0 py-3 text-lg outline-none ' +
  'transition-colors placeholder:text-muted-foreground/70 focus:border-foreground disabled:opacity-60'

export function ContactForm({ projectTypes }: { projectTypes: string[] }) {
  const lang = useLang()
  const t = STRINGS[lang]
  const [values, setValues] = useState<MessagePayload>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Partial<Record<Field | 'detail', string>>>({})
  const [formError, setFormError] = useState('')
  // Filled in only by bots that fill every field; the server then drops the request.
  const [trap, setTrap] = useState('')

  // After a failed submit, take the visitor to the first field that needs fixing.
  useEffect(() => {
    const first = (['name', 'phone', 'email', 'message'] as const).find((field) => errors[field])
    if (first) document.getElementById(first)?.focus()
  }, [errors])

  const update = useCallback(<K extends Field>(field: K, value: MessagePayload[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    // Clear the field's error as soon as the visitor edits it.
    setErrors(({ [field]: _removed, ...rest }) => rest)
  }, [])

  // A price card's "Discuss" button pre-selects its project type.
  useContactPrefill(useCallback((projectType) => update('project_type', projectType), [update]))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setErrors({})
    setFormError('')

    // Send only the contact the visitor chose, not leftovers from another method.
    const contact = CONTACT_FIELDS[values.contact_method].field
    const payload = { ...values, email: contact === 'email' ? values.email : '', phone: contact === 'phone' ? values.phone : '' }

    try {
      await sendMessage({ ...payload, hp_field: trap }, lang)
      setValues(EMPTY)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      if (error instanceof ApiError) {
        setErrors(error.fields)
        setFormError(error.message)
      } else {
        setFormError(t.form.networkError)
      }
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col items-start gap-6 rounded-2xl bg-inverse p-8 text-inverse-foreground lg:p-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-3xl font-medium tracking-tight">{t.form.sentTitle}</p>
          <p className="mt-3 max-w-md opacity-70">{t.form.sentText}</p>
        </div>
        <button type="button" onClick={() => setStatus('idle')} className="label underline underline-offset-4">
          {t.form.sendAnother}
        </button>
      </div>
    )
  }

  const disabled = status === 'sending'
  const contact = CONTACT_FIELDS[values.contact_method]

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input
            type="text"
            name="hp_field"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(event) => setTrap(event.target.value)}
          />
        </label>
      </div>

      {projectTypes.length > 0 ? (
        <Choices
          legend={t.form.projectType}
          name="project_type"
          options={[...projectTypes, t.form.other].map((type) => ({ value: type, label: type }))}
          value={values.project_type}
          onChange={(value) => update('project_type', value)}
          disabled={disabled}
          error={errors.project_type}
        />
      ) : null}

      <FormField id="name" label={t.form.name} error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={cn(INPUT_CLASSES, errors.name && 'border-danger')}
          placeholder={t.form.namePlaceholder}
        />
      </FormField>

      <div className="space-y-6">
        <Choices
          legend={t.form.method}
          name="contact_method"
          options={CONTACT_METHODS.map((value) => ({ value, label: t.form.methods[value] }))}
          value={values.contact_method}
          onChange={(value) => update('contact_method', value)}
          disabled={disabled}
        />
        <FormField id={contact.field} label={t.form[values.contact_method]} error={errors[contact.field]}>
          <input
            // Remount when the method changes so the browser applies the new type and autocomplete.
            key={values.contact_method}
            id={contact.field}
            name={contact.field}
            type={contact.type}
            required
            autoComplete={contact.autoComplete}
            value={values[contact.field]}
            onChange={(event) => update(contact.field, event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(errors[contact.field])}
            aria-describedby={errors[contact.field] ? `${contact.field}-error` : undefined}
            className={cn(INPUT_CLASSES, errors[contact.field] && 'border-danger')}
            placeholder={contact.placeholder}
          />
        </FormField>
      </div>

      <Choices
        legend={t.form.budget}
        name="budget"
        options={BUDGETS.map((value) => ({ value, label: t.form.budgets[value] }))}
        value={values.budget}
        onChange={(value) => update('budget', value)}
        disabled={disabled}
        error={errors.budget}
      />

      <FormField id="message" label={t.form.message} hint={t.form.optional} error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={cn(INPUT_CLASSES, 'resize-y', errors.message && 'border-danger')}
          placeholder={t.form.messagePlaceholder}
        />
      </FormField>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-6">
        <Button type="submit" size="lg" disabled={disabled}>
          {disabled ? t.form.sending : t.form.submit}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Button>
        <p className="max-w-xs text-xs text-muted-foreground">
          {t.form.consent}{' '}
          <Link href="/privacy/" className="underline underline-offset-2 hover:text-foreground">
            {t.form.privacy}
          </Link>
        </p>
      </div>
    </form>
  )
}

interface ChoicesProps<T extends string> {
  legend: string
  name: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T | ''
  onChange: (value: T) => void
  disabled: boolean
  error?: string
}

/** A radio group drawn as pill buttons. */
function Choices<T extends string>({ legend, name, options, value, onChange, disabled, error }: ChoicesProps<T>) {
  return (
    <fieldset>
      <legend className="label mb-4 text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="peer sr-only"
            />
            <span className="inline-flex h-11 items-center rounded-full border border-foreground/25 px-5 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground hover:border-foreground">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </fieldset>
  )
}

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label text-muted-foreground">
        {label}
        {hint ? <span className="ml-2 normal-case">({hint})</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
