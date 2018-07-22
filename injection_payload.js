const IP = module.exports

IP.payload = () => `
<!-- Code injected by livewire -->
<script type="text/javascript">
	// <![CDATA[  <-- For SVG support
	if ('WebSocket' in window) {
		(function() {
			function refreshCSS() {
				var sheets = [].slice.call(document.getElementsByTagName("link"))
				var head = document.getElementsByTagName("head")[0]
				for (var i = 0; i < sheets.length; ++i) {
					var elem = sheets[i]
					head.removeChild(elem)
					var rel = elem.rel
					if (elem.href && typeof rel !== "string" || rel.length === 0 || rel.toLowerCase() === "stylesheet") {
						var url = elem.href.replace(/(&|\\?)_cacheOverride=\\d+/, '')
						elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf())
					}
					head.appendChild(elem)
				}
			}
			var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://'
			var address = protocol + window.location.host + window.location.pathname + 'echo'
			var socket = new WebSocket(address)
			socket.onmessage = function(msg) {
				if (msg.data == 'fullReload') window.location.reload()
				else if (msg.data == 'stylesReload') refreshCSS()
			}
			console.log('Live reload enabled.')
		})()
	}
	// ]]>
</script>
`