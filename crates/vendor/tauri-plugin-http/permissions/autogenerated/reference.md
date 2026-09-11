## Default Permission

This permission set configures what kind of
fetch operations are available from the http plugin.

This enables all fetch operations but does not
allow explicitly any origins to be fetched. This needs to
be manually configured before usage.

#### Granted Permissions

All fetch operations are enabled.

#### This default permission set includes the following:

- `allow-fetch`
- `allow-fetch-cancel`
- `allow-fetch-read-body`
- `allow-fetch-send`

## Permission Table

<table>
<tr>
<th>Identifier</th>
<th>Description</th>
</tr>


<tr>
<td>

`http:allow-fetch`

</td>
<td>

Enables the fetch command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:deny-fetch`

</td>
<td>

Denies the fetch command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:allow-fetch-cancel`

</td>
<td>

Enables the fetch_cancel command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:deny-fetch-cancel`

</td>
<td>

Denies the fetch_cancel command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:allow-fetch-read-body`

</td>
<td>

Enables the fetch_read_body command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:deny-fetch-read-body`

</td>
<td>

Denies the fetch_read_body command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:allow-fetch-send`

</td>
<td>

Enables the fetch_send command without any pre-configured scope.

</td>
</tr>

<tr>
<td>

`http:deny-fetch-send`

</td>
<td>

Denies the fetch_send command without any pre-configured scope.

</td>
</tr>
</table>
