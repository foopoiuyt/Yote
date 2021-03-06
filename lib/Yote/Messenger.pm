package Yote::Messenger;

use Yote::Obj;

use base 'Yote::Obj';

#
# Data is :
#    recipients - list of receivers to send to
#    subject 
#    message
#
sub send_message {
    my( $self, $data, $acct ) = @_;
    
    my $recips = $data->{recipients};
    unless( $recips && @$recips ) {
	die "No Recipients given";
    }

    my $msg = new Yote::Obj();
    $msg->set_message( $data->{message} );
    $msg->set_subject( $data->{subject} );
    $msg->set_recipients( $recips );
    $msg->set_sent( time() );
    $msg->set_from( $self );

    for my $recip (@$recips) {
	my $envelope = {
	    message => $msg,
	    # read_time
	    # replied_time
	    # replies
	};

	# messages is private mostly because it can contain lots of data
	$recips->add_to__messages( $envelope );
    }

} #send_message

#
# Data is used for filtering messages
#    limit_start - for pagination
#    limit - max how many messages to return
#    sort - 'date', 'subject', 'name' default is date
#    sort_asc -  sort ascending flag
#    sort_desc - sort descending flag
#    filter - {  subject => 'text', from => messenger, older_than => time, newer_than => time, from_name => 'name' }
#
sub read_messages {
    my( $self, $data, $acct ) = @_;

    my $all_messages = $self->get__messages();
    
    if( $data->{filter} ) {
	if( $data->{filter}{newer_than} ) {
	    $all_messages = [ grep { $_->get_message()->get_sent() >= $data->{filter}{newer_than} } @$all_messages ];
	}
	if( $data->{filter}{older_than} ) {
	    $all_messages = [ grep { $_->get_message()->get_sent() <= $data->{filter}{older_than} } @$all_messages ];
	}
	if( $data->{filter}{from_name} ) {
	    $all_messages = [ grep {  $_->get_message()->get_from()->get_handle() =~ /$data->{filter}{from}/i  } @$all_messages ];
	}
	if( $data->{filter}{from} ) {
	    $all_messages = [ grep { $data->{filter}{from}->is( $_->get_message()->get_from() )  } @$all_messages ];
	}
	if( $data->{filter}{subject} ) {
	    $all_messages = [ grep { $_->get_message()->get_subject() =~ /$data->{filter}{subject}/i } @$all_messages ];
	}
    } #filters
    
    if( $data->{sort} eq 'date' ) {
	if( $sort_asc ) {
	    $all_messages = [ sort { $a->get_sent() <=> $b->get_sent()  } @$all_messages ];
	} else {
	    $all_messages = [ sort { $b->get_sent() <=> $a->get_sent()  } @$all_messages ];
	}
    }
    elsif( $data->{sort} eq 'name' ) {
	if( $sort_desc ) {
	    $all_messages = [ sort { $b->get_from()->get_handle() cmp $a->get_from()->get_handle()  } @$all_messages ];
	} else {
	    $all_messages = [ sort { $a->get_from()->get_handle() cmp $b->get_from()->get_handle()  } @$all_messages ];
	}	
    }
    elsif( $data->{sort} eq 'subject' ) {
	if( $sort_desc ) {
	    $all_messages = [ sort { $b->get_subject() cmp $a->get_subject()  } @$all_messages ];
	} else {
	    $all_messages = [ sort { $a->get_subject() cmp $b->get_subject()  } @$all_messages ];
	}	
    }

    if( $data->{limit} ) {
	if( $data->{limit_start} ) {
	    $all_messages = [@$all_messages[$data->{limit_start}..$data->{limit}]];
	} 
	else {

	    $all_messages = [@$all_messages[0..$data->{limit}]];
	}
    }

    return $all_messages;

} #read_messages

1;

__END__
