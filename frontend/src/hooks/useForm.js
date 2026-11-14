import { useCallback, useState } from 'react';
import { validate } from '../utils/validation';

/**
 * Small form-state helper.
 *  - Errors appear after a field is blurred or the form is submitted (not while typing the first time).
 *  - Once a field has been touched, it re-validates on every change.
 *
 * const form = useForm({ email: '' }, (values) => ({ email: rules.email }));
 * <TextField {...form.field('email')} />
 * form.handleSubmit(async (values) => { ... })
 */
export function useForm(initialValues, getSchema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const runValidation = useCallback((nextValues) => validate(nextValues, getSchema(nextValues)), [getSchema]);

  const setValue = useCallback(
    (name, value) => {
      const next = { ...values, [name]: value };
      setValues(next);
      // Re-validate every touched field (so "confirm password" updates when "password" changes)
      const all = runValidation(next);
      setErrors((prev) => {
        const updated = { ...prev };
        Object.keys(touched).forEach((key) => {
          if (touched[key]) updated[key] = all[key];
        });
        return updated;
      });
    },
    [runValidation, touched, values],
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: runValidation(values)[name] }));
    },
    [runValidation, values],
  );

  const field = useCallback(
    (name) => ({
      name,
      value: values[name],
      error: touched[name] ? errors[name] : '',
      onChange: (e) => setValue(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
      onBlur: () => handleBlur(name),
    }),
    [values, errors, touched, setValue, handleBlur],
  );

  const setFieldError = useCallback((name, message) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  /** Validates everything, marks all fields touched, and calls onValid only when there are no errors. */
  const handleSubmit = useCallback(
    (onValid) => async (event) => {
      event?.preventDefault();
      const allErrors = runValidation(values);
      setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      setErrors(allErrors);
      if (Object.keys(allErrors).length) {
        // Move focus to the first invalid field
        const first = Object.keys(allErrors)[0];
        document.querySelector(`[name="${first}"]`)?.focus();
        return;
      }
      setSubmitting(true);
      try {
        await onValid(values);
      } finally {
        setSubmitting(false);
      }
    },
    [runValidation, values],
  );

  const reset = useCallback(
    (next = initialValues) => {
      setValues(next);
      setErrors({});
      setTouched({});
    },
    [initialValues],
  );

  return { values, errors, touched, submitting, field, setValue, setValues, setFieldError, handleSubmit, reset };
}
