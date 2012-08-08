<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<c:set var="newIndex" value="0" scope="page"/>
<stripes:form partial="true" action="/action/example_use">
	<script type="text/javascript" language="Javascript">
		$(function(){
			$('#example').dyntable({
				saveEventName: 'savePreviouslySubmitted',
				deleteEventName: 'deletePreviouslySubmitted'
			});
		});
	</script>
	<style type="text/css">
		table.fixedWidth {
			width: 100%;
			table-layout: fixed;
		}

		table.fixedWidth td {
			width: 100%;
			table-layout: fixed;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	</style>
	<table id="example" class="sortable fixedWidth">
		<thead>
			<tr>
				<th style="width:150px">Value</th>
				<th>CheckBox</th>
			</tr>
		</thead>
		<tbody>
			<c:forEach items="${actionBean.example.object}" var="item" varStatus="loop">
				<tr>
					<td><stripes:text name="example.value"/></td>
					<td><stripes:checkbox name="example.checkbox"/></td>
				</tr>
				<c:set var="newIndex" value="${loop.index + 1}" scope="page"/>
			</c:forEach>
			<tr>
				<td><stripes:text name="example.value"/></td>
				<td><stripes:checkbox name="example.checkbox"/></td>
			</tr>
		</tbody>
	</table>
</stripes:form>
