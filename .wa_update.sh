#!/bin/bash
set -e

# Define the new message templates (URL-encoded)
SERVICE_MSG='%F0%9F%96%A8%EF%B8%8F%20New%20Order%20%E2%80%94%20virarprint.in%0AService%3A%20SERVICENAME%0ASource%3A%20PAGENAME%20Page%0A%0A%F0%9F%93%8E%20Please%20attach%20your%20file%20below.'
GENERIC_MSG='%F0%9F%96%A8%EF%B8%8F%20New%20Enquiry%20%E2%80%94%20virarprint.in%0ASource%3A%20PAGENAME%20Page%0A%0A%F0%9F%93%8E%20Please%20attach%20your%20file%20below.'

update_service_page() {
    local file="$1"
    local service_name="$2"
    local page_name="$3"
    
    local svc_msg="${SERVICE_MSG//SERVICENAME/$service_name}"
    svc_msg="${svc_msg//PAGENAME/$page_name}"
    
    local gen_msg="${GENERIC_MSG//PAGENAME/$page_name}"
    
    echo "Updating $file..."
    echo "  Service msg: ?text=$svc_msg"
    echo "  Generic msg: ?text=$gen_msg"
}

# Just print what we'll do
update_service_page "services/printing.html" "Printing" "Printing"
update_service_page "services/xerox.html" "Xerox" "Xerox"
update_service_page "services/lamination.html" "Lamination" "Lamination"
update_service_page "services/binding.html" "Binding" "Binding"
update_service_page "services/passport-photos.html" "Passport Photos" "Passport Photos"
update_service_page "services/thesis-printing.html" "Thesis Printing" "Thesis Printing"

echo "Done planning."
