package Yote::AppRoot;

#
# Base class for all Yote applications.
#

use strict;

use Yote::Obj;
use Crypt::Passwd;
use Email::Valid;
use MIME::Lite;
use MIME::Base64;

use base 'Yote::Obj';

#
# Available to all apps. Used for verification and for cookie login.
#
sub token_login {
    my( $self, $data ) = @_;
    my( $t, $ip ) = ( $data->{t}, $data->{_ip} );
    if( $t =~ /(.+)\+(.+)/ ) {
        my( $uid, $token ) = ( $1, $2 );
        my $login = Yote::ObjProvider::fetch( $uid );
        if( $login && $login->get_token() eq "${token}x$ip" ) {
	    return $login;
	}
    }
    return 0;
} #token_login

#
# Return the account object for this app.
#
sub account {
    my( $self, $data, $account ) = @_;
    return $account;
} #account

#
# Returns the account root attached to this AppRoot for the given account.
#
sub _get_account {
    my( $self, $login ) = @_;
    my $accts = $self->get__account_roots({});
    my $acct = $accts->{$login->{ID}};
    unless( $acct ) {
        $acct = new Yote::Obj();
        $acct->set__allowed_access({});
        $acct->set_login( $login );
        $accts->{$login->{ID}} = $acct;
	$self->_init_account( $acct );
    }
    return $acct;

} #_get_account

#
# Intializes the account object passed in.
#
sub _init_account {}

#
# Returns true if the object was given to the account via the API, as opposed to a random object id
#   being picked.
#
sub _account_can_access {
    return 1;
#    my( $self, $account, $object ) = @_;
#    my $o_id = Yote::ObjProvider::get_id( $object );
#    return $account->get_login()->get__allowed_access()->{ $o_id };
} #_account_can_access

#
# Encrypt the password so its not saved in plain text.
#
sub _encrypt_pass {
    my( $self, $pw, $acct ) = @_;
    return $acct ? unix_std_crypt( $pw, $acct->get_handle() ) : undef;
} #_encrypt_pass


1;

__END__

=head1 NAME

Yote::AppRoot - Application Server Base Objects

=head1 SYNOPSIS

Extend this class to make an application, and fill it with methods that you want for your application.


=head1 DESCRIPTION

Each Web Application has a single container object as the entry point to that object which is an instance of the Yote::AppRoot class. A Yote::AppRoot extends Yote::Obj and provides some class methods and the following stub methods.

=head2 Client Methods

Clients automatically call the following methods on an application or the Yote Root application /

=over 4

=item create_account

=item login

=item verify_token

=item remove_account

=item reset_password

=back

=head2 CLASS METHODS

=over 4

=item _fetch_root - returns the master root object.

The master root object contains all web application roots. It is an AppRoot object.

Returns the root object. This is always object 1 for the App Server.

=back

=head2 STUB METHODS

=over 4

=item init - called the first time this root is created. Initializes account root.

=back

=head3 INSTANCE METHODS

=over 4

=item _account_root( login ) - Returns an account object associated with a login object.

=back

The account root is there to store information specific to the account in question. It could include 
documents specific to the account or games the account is participating in. This is distinct from the
login object itself, though there is a one to one mapping between the account root and the login.

=head1 AUTHOR

Eric Wolf

=head1 LICENSE AND COPYRIGHT

Copyright (C) 2011 Eric Wolf

This module is free software; it can be used under the same terms as perl
itself.

=cut
