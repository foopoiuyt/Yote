package GServ::Hello;

use strict;

use GServ::Obj;

use base 'GServ::AppRoot';

sub init {
    my $self = shift;
    #when the hello is created for the first time, install a counter to track how many times it is called
    my $counter = $self->get_counter( new GServ::Obj() );
    $self->set_testfield(int(rand(10)));
    $self->get_list( [ 1, "Bagel", $counter ] );
    $self->get_hash( { one=>1, food => "Bagel", thing => $counter } );
}

sub hello {
    my( $self, $data, $acct ) = @_;
    my $name = $data->{name};
    $self->set_testfield(int(rand(10))); # set this to a random value each time
    my $counter = $self->get_counter(); # this could be counted with a field, but I wanted to demo how easy it is to send objects across.
    $counter->set_count( $counter->get_count() + 1 ); #increment the value in the counter
    return "hello there '$name'. I have said hello ".$counter->get_count()." times.";
}

1;
