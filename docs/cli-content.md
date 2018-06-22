Download the real Satoshi Nakamoto's photo from the Alpha persona service:
<pre>
$ edsig get images/nakamoto.jpg
</pre>

Upload the hawaii.jpg image to your persona on the Alpha service.  Note that --nickname only requires a case-insensitive partial match, so lowercase "sat" matches "Satoshi".  The --service also matches partial service names.
<pre>
$ edsig put ~/mypictures/hawaii.jpg images/hawaii.jpg --nickname sat --service alpha
</pre>

Delete a file from a persona service.  The filename is relative to your personas directory.  The shorthand version of --nickname is -n
<pre>
$ edsig persona delete images/hawaii.jpg -n sat --service alp
</pre>

Make (or ensure they exist) a directory and child directory named "share/resume" on a persona server, under my persona identified with a nickname containing "Satoshi"
<pre>
$ edsig persona mkdir "share/resume" --service alpha --nickname Satoshi
</pre>

Publish my Stanford resume that has an Edwards Signature from Stanford, to my resume directory:
<pre>
$ edsig persona put stanford.pdf share/resume/stanford.pdf --content-sig stanford.pdf.sig -n sat -s alp
</pre>

Remove a directory named "share" on a persona server, under my persona identified with a nickname containing "Satoshi".  All directories under the share directory are also removed.
<pre>
$ edsig persona delete share --service alpha --nickname Satoshi
</pre>