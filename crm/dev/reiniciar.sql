-- Deja la base LOCAL de pruebas como recién sembrada (crm/dev/semilla.sql
-- después de esto). Solo para la base local de wrangler dev: nunca contra
-- rhf-leads ni rhf-leads-preview.
DELETE FROM crm_actividades;
DELETE FROM crm_oportunidades;
DELETE FROM crm_contactos;
DELETE FROM crm_tareas;
DELETE FROM crm_auditoria;
DELETE FROM crm_codigos;
DELETE FROM crm_sesiones;
DELETE FROM crm_ingesta;
DELETE FROM consultas;
DELETE FROM suscripcion_eventos;
DELETE FROM suscriptores;
DELETE FROM sqlite_sequence
 WHERE name IN ('crm_actividades', 'crm_oportunidades', 'crm_contactos', 'crm_tareas', 'crm_auditoria',
                'crm_codigos', 'consultas', 'suscripcion_eventos', 'suscriptores');
