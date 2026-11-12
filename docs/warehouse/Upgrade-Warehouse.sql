-- Existing Warehouse databases with P01..P09 already installed.
-- Run with psql -f Upgrade-Warehouse.sql using the database owner's connection.
-- Each upgrade is transactional and can be rerun; execution stops on the first error.
\set ON_ERROR_STOP on
\ir P10_partial_reservations.sql
\ir P11_transfer_receiving.sql
