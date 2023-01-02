document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

    // Send the email
    document.querySelector('#button').addEventListener('click', () => send_email());
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}
  
function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#particular-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Load content, if so
    load_mailbox_content(mailbox);
}

function send_email() {

    // Retrive information from form
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        })
      })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    })
    .catch(error => console.log(error));

    // Load the user's sent mailbox
    // load_mailbox('sent');
    
}

function load_mailbox_content(mailbox) {

    // This fetch does nothing. It is a way to take, with the second fetch, the newest inofrmation from server
    fetch(`emails/${mailbox}`)

    // Loading mailbox content from server
    fetch(`emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // Create a new div and populate it some email information
        emails.forEach(element => {
            const boxDiv = document.createElement('div');
            const emailDiv = document.createElement('div');
            const content = {'sender': element.sender, 'subject': element.subject, 'timestamp': element.timestamp};
            const userIsSender = element.sender == document.querySelector("#user-email").innerHTML;

            // Put a class on each new created div
            emailDiv.setAttribute('class', 'emails-inside-the-view'); 

            // Compose the html that will represent the email
            for (const [key, value] of Object.entries(content)) {
                emailDiv.innerHTML += `<p>${key}: ${value}.</p>`;
            }

            // When clicked, change its backgrouncolor and make a new request to have more info about the email
            emailDiv.addEventListener('click', function () {
                mark_as_read(element);
                particular_email(element);
            });
            
            // Change the background of the div if it was alreary read
            if (element.read == false) {
                emailDiv.style.backgroundColor = 'gray';
            }
            else {
                emailDiv.style.backgroundColor = 'white';
            } 

            if (!userIsSender) {
                if (element.read == false) {
                    emailDiv.style.backgroundColor = 'gray';
                }
                else {
                    emailDiv.style.backgroundColor = 'white';
                }
            }

            // Append boxDiv to mainDiv
            boxDiv.append(emailDiv);
            // Insert a button to mainDiv
            addButtons(element, boxDiv, userIsSender);

            document.querySelector('#emails-view').append(boxDiv);
        })
    })
    .catch(error => console.log(error));
}

function mark_as_read(email) {

    // Make a PUT request to change the background of a clicked div
    fetch(`emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: false,
        })
      })
    .catch(error => console.log(error));
}

function change_archive_state(email, boolean) {

    // Archive or unarchive an email
    fetch(`emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !boolean,
        })
      })
    .catch(error => console.log(error));

    // Reload the inbox
    load_mailbox('inbox');
}

function particular_email(email) {

    // Ask for and treat specific info about the passed in email
    fetch(`/emails/${email.id}`)
    .then(response => response.json())
    .then(data => {
        document.querySelector('#particular-email-subject').innerHTML = data.subject;
        document.querySelector('#particular-email-sender').innerHTML = data.sender;
        document.querySelector('#particular-email-recipients').innerHTML = data.recipients;
        document.querySelector('#particular-email-body').innerHTML = data.body;
        document.querySelector('#particular-email-timestamp').innerHTML = data.timestamp;

        particular_view()
    })
    .catch(error => console.log(error))
}

function particular_view() {

    // Show the div with id equals to particular-view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#particular-view').style.display = 'block';
}

function addButtons(email, tag_for_insert, emailWasSentByUser){

    if (!emailWasSentByUser) {
        // A button for (un)archive an email
        const button = document.createElement('button');
        button.innerHTML = 'Unarchive email';
        button.setAttribute('class', 'archive-or-unarchive-button');
        if (!email.archived) {button.innerHTML = 'Archive email';}
        
        // Events for archive or unarchive a email
        button.addEventListener('click', function () {change_archive_state(email, email.archived)}); // funcion () {anotherfunction(parameters)} is used to not calling the event when the page is loaded
        
        // A button to reply to
        const reply = document.createElement('button');
        reply.innerHTML = 'Reply';
        reply.setAttribute('class', 'reply');

        reply.addEventListener('click', function () {reply_to(email)});
        
        tag_for_insert.append(button, reply);
    }
}

function reply_to(email) {

    // Compose an email
    compose_email();

    // Pre-fill that email with appropriete info
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}
