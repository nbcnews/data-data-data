#!/usr/bin/bash
URL='https://www.justice.gov/storage/report.pdf'
while [ True ]; do
    RANDO=$(openssl rand -base64 40 | tr -dc 'a-zA-Z'; openssl rand -base64 40 | tr -dc 'a-zA-Z')
    wget -O full-mueller-report.pdf "$URL?$RANDO"
    if [[ $? -ne 8 ]]; then
        # Upload it to wherever it belongs
        say "We've got it"
        break;
    fi
    sleep 1
done
