

export function emptyOrRow(rows: any) {
    if (rows && rows.length > 0) {
        return rows[0]
    }else {
        return {}
    }
}

export function emptyOrRows(rows: any) {
    if (rows && rows.length > 0) {
        return rows
    }else {
        return []
    }
}