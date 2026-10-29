param(
    [Parameter(Mandatory = $true)]
    [string] $OutputFile
)

$ErrorActionPreference = 'Stop'
if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    throw 'Install PostgreSQL client tools and add pg_dump to PATH.'
}
if (Test-Path -LiteralPath $OutputFile) {
    throw 'Output already exists. Choose a new path to preserve the previous backup.'
}
# Connection comes from PGHOST, PGPORT, PGDATABASE, PGUSER and .pgpass/PGPASSWORD.
# No credentials are stored here or printed.
$warehouseDumpArgs = @('--format=custom', '--no-owner', '--no-privileges',
    '--strict-names', '--table=public.warehouses', '--table=public.storage_locations',
    "--file=$OutputFile")
& pg_dump @warehouseDumpArgs
if ($LASTEXITCODE -ne 0) {
    throw 'Backup failed. Do not use a partial output as a valid backup.'
}
& pg_restore --list $OutputFile | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'pg_restore could not read the backup archive.' }
Write-Output "Warehouse backup created: $OutputFile"
