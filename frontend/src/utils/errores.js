export function getErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  return error?.message || "Ocurrio un error inesperado";
}

export function getErrorDetails(error) {
  const details = error?.response?.data?.details;
  if (!details) return [];
  if (Array.isArray(details)) return details;
  return Object.entries(details).flatMap(([campo, mensajes]) =>
    (Array.isArray(mensajes) ? mensajes : [mensajes]).map((m) => `${campo}: ${m}`)
  );
}
